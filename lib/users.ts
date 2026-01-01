import { createServerClient } from './supabase-server';

export interface User {
  id: string;
  email: string;
  passwordHash?: string; // Only for migration, will be removed
  role: 'admin' | 'user';
  mollieCustomerId?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  vatNumber?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

// Get all users (admin only) - deprecated, use getUsersAsync instead
export function getUsers(): User[] {
  console.warn('getUsers() is deprecated, use getUsersAsync() instead');
  return [];
}

// Get all users async (for async contexts)
export async function getUsersAsync(): Promise<User[]> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return (data || []).map(mapDbUserToUser);
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Find user by email
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return undefined;
      }
      console.error('Error fetching user by email:', error);
      return undefined;
    }

    return data ? mapDbUserToUser(data) : undefined;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return undefined;
  }
}

// Find user by ID
export async function getUserById(id: string): Promise<User | undefined> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return undefined;
      }
      console.error('Error fetching user by id:', error);
      return undefined;
    }

    return data ? mapDbUserToUser(data) : undefined;
  } catch (error) {
    console.error('Error fetching user by id:', error);
    return undefined;
  }
}

// Create a new user (for migration - will use Supabase Auth later)
export async function createUser(
  email: string,
  password: string,
  role: 'admin' | 'user' = 'user'
): Promise<User> {
  const supabase = createServerClient();
  
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // For now, we'll create the user in the database
  // Later, this will be handled by Supabase Auth
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }

  return mapDbUserToUser(data);
}

// Update user
export async function updateUser(email: string, updates: Partial<User>): Promise<User | null> {
  const supabase = createServerClient();
  
  // Don't allow updating email or id
  const { email: _, id: __, ...allowedUpdates } = updates;
  
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (allowedUpdates.role !== undefined) updateData.role = allowedUpdates.role;
  if (allowedUpdates.mollieCustomerId !== undefined) updateData.mollie_customer_id = allowedUpdates.mollieCustomerId;
  if (allowedUpdates.companyName !== undefined) updateData.company_name = allowedUpdates.companyName;
  if (allowedUpdates.firstName !== undefined) updateData.first_name = allowedUpdates.firstName;
  if (allowedUpdates.lastName !== undefined) updateData.last_name = allowedUpdates.lastName;
  if (allowedUpdates.vatNumber !== undefined) updateData.vat_number = allowedUpdates.vatNumber;
  if (allowedUpdates.phoneNumber !== undefined) updateData.phone_number = allowedUpdates.phoneNumber;

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('email', email.toLowerCase())
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }

  return data ? mapDbUserToUser(data) : null;
}

// Delete user
export async function deleteUser(email: string): Promise<void> {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('email', email.toLowerCase());

  if (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

// Check if user is admin - deprecated, use isAdminUserAsync instead
export function isAdminUser(email: string): boolean {
  console.warn('isAdminUser() is deprecated, use isAdminUserAsync() instead');
  return false;
}

// Async version of isAdminUser
export async function isAdminUserAsync(email: string): Promise<boolean> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, email')
      .eq('email', email.toLowerCase())
      .eq('role', 'admin')
      .eq('email', 'rubenfonteijne@gmail.com')
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === 'admin' && data.email === 'rubenfonteijne@gmail.com';
  } catch (error) {
    return false;
  }
}

// Helper function to map database user to User interface
function mapDbUserToUser(dbUser: any): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    passwordHash: dbUser.password_hash,
    role: dbUser.role,
    mollieCustomerId: dbUser.mollie_customer_id,
    companyName: dbUser.company_name,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    vatNumber: dbUser.vat_number,
    phoneNumber: dbUser.phone_number,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}
