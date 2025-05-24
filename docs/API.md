
# API Documentation

## Edge Functions

### send-reminders

Processes and sends reminders that are due today.

**Endpoint:** `POST /functions/v1/send-reminders`

**Headers:**
```
Authorization: Bearer <anon_key>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "processed": 3,
  "results": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "phone": "+1234567890",
      "status": "success"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Database Tables

### profiles

User profile information.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### reminders

Reminder data with user associations.

```sql
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  custom_message TEXT NOT NULL,
  reminder_date DATE NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security Policies

### profiles
- Users can view their own profile
- Users can insert their own profile
- Users can update their own profile

### reminders
- Users can view their own reminders
- Users can create their own reminders
- Users can update their own reminders
- Users can delete their own reminders

## Triggers

### handle_new_user()
Automatically creates a profile entry when a new user registers.

### handle_updated_at()
Updates the `updated_at` timestamp on row updates.
