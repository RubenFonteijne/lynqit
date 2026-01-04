import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";
import { getUserByEmail } from "@/lib/users";
import { getPageById, updatePage, deletePage, createPage } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";
import { getDiscountCodeById, incrementDiscountCodeUsage } from "@/lib/discount-codes";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentId = body.id;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Get payment from Mollie
    const mollieClient = await getMollieClient();
    const payment = await mollieClient.payments.get(paymentId);

    const metadata = payment.metadata as { 
      email?: string; 
      plan?: SubscriptionPlan; 
      pageId?: string; 
      subscriptionId?: string;
      discountCodeId?: string;
      appliedDiscount?: string;
      slug?: string;
      password?: string;
      createAccount?: string;
    } | undefined;
    const email = metadata?.email;
    const plan = metadata?.plan;
    const pageId = metadata?.pageId;
    const slug = metadata?.slug;
    const password = metadata?.password;
    const createAccount = metadata?.createAccount === "true";

    if (!email || !plan) {
      return NextResponse.json(
        { error: "Invalid payment metadata: email and plan are required" },
        { status: 400 }
      );
    }

    // For new registrations, we need slug and password
    if (createAccount && (!slug || !password)) {
      return NextResponse.json(
        { error: "Invalid payment metadata: slug and password are required for new account creation" },
        { status: 400 }
      );
    }

    let user = await getUserByEmail(email);
    let page = pageId ? await getPageById(pageId) : null;

    // Update page subscription based on payment status
    // IMPORTANT: Only create account and send confirmation email when payment status is "paid"
    if (payment.status === "paid") {
      // Create account if this is a new registration AND payment is paid
      // This ensures confirmation email is only sent after successful payment
      if (createAccount && !user && slug && password) {
        try {
          // Create user account via Supabase Auth
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

          if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Missing Supabase configuration");
          }

          const { createClient } = await import('@supabase/supabase-js');
          const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });

          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
          
          // Sign up user (this will send confirmation email if enabled)
          // Only called when payment status is "paid"
          const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
            email: email.toLowerCase(),
            password,
            options: {
              emailRedirectTo: `${baseUrl}/account-confirmed`,
            },
          });

          if (authError || !authData.user) {
            console.error("Error creating user account:", authError);
            throw new Error(authError?.message || "Failed to create user account");
          }

          // Create user in database
          const supabaseAdmin = createServerClient();
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              id: authData.user.id,
              email: email.toLowerCase(),
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();
          
          if (createError) {
            console.error("Error creating user in database:", createError);
            throw new Error(`Failed to create user in database: ${createError.message}`);
          }

          user = {
            id: newUser.id,
            email: newUser.email,
            role: (newUser.role || 'user') as 'admin' | 'user',
            createdAt: newUser.created_at || new Date().toISOString(),
            updatedAt: newUser.updated_at,
          };

          console.log("Created user account for:", email, "after payment was confirmed as paid");
        } catch (error: any) {
          console.error("Error creating account in webhook:", error);
          // Don't fail the webhook, but log the error
          // The payment is still valid, we can retry account creation later
          return NextResponse.json(
            { success: false, error: `Failed to create account: ${error.message}` },
            { status: 200 } // Return 200 to Mollie
          );
        }
      }

      // If user still doesn't exist after creation attempt, we can't proceed
      if (!user) {
        return NextResponse.json(
          { error: "User not found and could not be created" },
          { status: 404 }
        );
      }

      // Create page if it doesn't exist (for new registrations)
      if (!page && slug && user) {
        try {
          const newPage = await createPage(
            user.email, // userId
            slug, // slug
            {
              subscriptionPlan: plan,
              subscriptionStatus: "expired", // Will be set to active below
            }
          );
          page = newPage;
          console.log("Created page for new registration:", newPage.id);
        } catch (error: any) {
          console.error("Error creating page in webhook:", error);
          // If page creation fails, try to continue with existing page if pageId was provided
          if (pageId) {
            page = await getPageById(pageId);
          }
        }
      }

      // Verify page exists and belongs to user
      if (!page) {
        return NextResponse.json(
          { error: "Page not found and could not be created" },
          { status: 404 }
        );
      }

      if (page.userId !== email) {
        return NextResponse.json(
          { error: "Page does not belong to user" },
          { status: 403 }
        );
      }

      // Payment successful - activate subscription
      // Payment successful - this is likely the first payment for a subscription
      const now = new Date();
      const subscriptionEndDate = new Date(now);
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month from now

      // Check if this payment is linked to a subscription
      // Mollie payments for subscriptions have a subscriptionId property
      const subscriptionId = (payment as any).subscriptionId || metadata?.subscriptionId || page.mollieSubscriptionId;

      // Increment discount code usage if applied
      if (metadata?.discountCodeId && metadata?.appliedDiscount === "true") {
        try {
          await incrementDiscountCodeUsage(metadata.discountCodeId);
        } catch (error) {
          console.error("Error incrementing discount code usage:", error);
          // Don't fail the webhook if discount code update fails
        }
      }

      if (subscriptionId) {
        // Payment is part of a subscription - activate the subscription
        // The subscription webhook will handle future monthly payments
        await updatePage(page.id, {
          subscriptionPlan: plan,
          subscriptionStatus: "active",
          subscriptionStartDate: now.toISOString(),
          subscriptionEndDate: subscriptionEndDate.toISOString(),
          mollieSubscriptionId: subscriptionId,
        });
      } else {
        // No subscription ID - this might be a legacy payment, activate directly
        await updatePage(page.id, {
          subscriptionPlan: plan,
          subscriptionStatus: "active",
          subscriptionStartDate: now.toISOString(),
          subscriptionEndDate: subscriptionEndDate.toISOString(),
        });
      }
    } else if (payment.status === "failed" || payment.status === "canceled" || payment.status === "expired") {
      // Payment failed - delete the page since payment was not completed
      // Only delete if this was a new page creation (not an upgrade)
      // Check if page was just created (has expired status and paid plan)
      if (page.subscriptionStatus === "expired" && page.subscriptionPlan !== "free") {
        await deletePage(page.id);
        console.log(`Deleted page ${page.id} due to failed payment`);
      } else {
        // For existing pages (upgrades), just revert to free plan
        await updatePage(page.id, {
          subscriptionPlan: "free",
          subscriptionStatus: "expired",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred processing webhook" },
      { status: 500 }
    );
  }
}

