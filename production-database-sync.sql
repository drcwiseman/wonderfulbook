-- Production Database Sync Script
-- This script will sync your production database with development database
-- Run this against your PRODUCTION database to fix deployment issues

-- Start transaction for safety
BEGIN;

-- Drop all existing tables to ensure clean sync
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Grant permissions
GRANT ALL ON SCHEMA public TO neondb_owner;
GRANT ALL ON SCHEMA public TO public;

-- Create all tables with correct structure
CREATE TABLE public.book_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    book_id character varying NOT NULL,
    category_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.bookmarks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    book_id character varying NOT NULL,
    page integer NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.books (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    author text NOT NULL,
    description text,
    cover_image_url text,
    pdf_url text,
    rating numeric(3,2) DEFAULT 0.00,
    total_ratings integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    required_tier character varying DEFAULT 'free'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.free_trial_abuse_prevention (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    email_domain character varying NOT NULL,
    registration_ip character varying NOT NULL,
    device_fingerprint character varying,
    user_id character varying,
    free_trial_started_at timestamp without time zone NOT NULL,
    free_trial_ended_at timestamp without time zone,
    is_blocked boolean DEFAULT false,
    block_reason character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.reading_progress (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    book_id character varying NOT NULL,
    current_page integer DEFAULT 0,
    total_pages integer DEFAULT 0,
    progress_percentage numeric(5,2) DEFAULT 0.00,
    last_read_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);

CREATE TABLE public.signup_attempts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    registration_ip character varying NOT NULL,
    device_fingerprint character varying,
    attempted_at timestamp without time zone DEFAULT now(),
    successful boolean DEFAULT false,
    block_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.subscription_plans (
    id character varying NOT NULL,
    name character varying NOT NULL,
    price character varying NOT NULL,
    price_amount integer NOT NULL,
    currency character varying DEFAULT 'GBP'::character varying,
    period character varying DEFAULT 'per month'::character varying,
    description text,
    book_limit integer DEFAULT 3,
    features text[],
    is_active boolean DEFAULT true,
    stripe_price_id character varying,
    display_order integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.user_selected_books (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    book_id character varying NOT NULL,
    subscription_tier character varying NOT NULL,
    selected_at timestamp without time zone DEFAULT now(),
    locked_until timestamp without time zone NOT NULL,
    billing_cycle_start timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.user_subscription_cycles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    subscription_tier character varying NOT NULL,
    cycle_start timestamp without time zone NOT NULL,
    cycle_end timestamp without time zone NOT NULL,
    books_selected_count integer DEFAULT 0,
    max_books integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    stripe_customer_id character varying,
    stripe_subscription_id character varying,
    subscription_tier character varying DEFAULT 'free'::character varying,
    subscription_status character varying DEFAULT 'inactive'::character varying,
    books_read_this_month integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role character varying DEFAULT 'user'::character varying,
    is_active boolean DEFAULT true,
    last_login_at timestamp without time zone,
    password_reset_token character varying,
    password_reset_expires timestamp without time zone,
    username character varying,
    password_hash character varying,
    email_verified boolean DEFAULT false,
    email_verification_token character varying,
    auth_provider character varying DEFAULT 'replit'::character varying,
    free_trial_used boolean DEFAULT false,
    free_trial_started_at timestamp without time zone,
    free_trial_ended_at timestamp without time zone,
    registration_ip character varying,
    device_fingerprint character varying
);

-- Set ownership
ALTER TABLE public.book_categories OWNER TO neondb_owner;
ALTER TABLE public.bookmarks OWNER TO neondb_owner;
ALTER TABLE public.books OWNER TO neondb_owner;
ALTER TABLE public.categories OWNER TO neondb_owner;
ALTER TABLE public.free_trial_abuse_prevention OWNER TO neondb_owner;
ALTER TABLE public.reading_progress OWNER TO neondb_owner;
ALTER TABLE public.sessions OWNER TO neondb_owner;
ALTER TABLE public.signup_attempts OWNER TO neondb_owner;
ALTER TABLE public.subscription_plans OWNER TO neondb_owner;
ALTER TABLE public.user_selected_books OWNER TO neondb_owner;
ALTER TABLE public.user_subscription_cycles OWNER TO neondb_owner;
ALTER TABLE public.users OWNER TO neondb_owner;

-- Add primary keys and constraints
ALTER TABLE ONLY public.book_categories ADD CONSTRAINT book_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bookmarks ADD CONSTRAINT bookmarks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.books ADD CONSTRAINT books_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.free_trial_abuse_prevention ADD CONSTRAINT free_trial_abuse_prevention_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reading_progress ADD CONSTRAINT reading_progress_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);
ALTER TABLE ONLY public.signup_attempts ADD CONSTRAINT signup_attempts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.subscription_plans ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_selected_books ADD CONSTRAINT user_selected_books_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_subscription_cycles ADD CONSTRAINT user_subscription_cycles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Add unique constraints
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_name_key UNIQUE (name);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Add foreign key constraints
ALTER TABLE ONLY public.book_categories ADD CONSTRAINT book_categories_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.book_categories ADD CONSTRAINT book_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.bookmarks ADD CONSTRAINT bookmarks_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.bookmarks ADD CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.free_trial_abuse_prevention ADD CONSTRAINT free_trial_abuse_prevention_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reading_progress ADD CONSTRAINT reading_progress_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reading_progress ADD CONSTRAINT reading_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_selected_books ADD CONSTRAINT user_selected_books_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_selected_books ADD CONSTRAINT user_selected_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_subscription_cycles ADD CONSTRAINT user_subscription_cycles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX sessions_expire_idx ON public.sessions USING btree (expire);
CREATE INDEX idx_user_selected_books_user_id ON public.user_selected_books USING btree (user_id);
CREATE INDEX idx_user_selected_books_book_id ON public.user_selected_books USING btree (book_id);
CREATE INDEX idx_reading_progress_user_id ON public.reading_progress USING btree (user_id);
CREATE INDEX idx_reading_progress_book_id ON public.reading_progress USING btree (book_id);
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks USING btree (user_id);
CREATE INDEX idx_free_trial_email ON public.free_trial_abuse_prevention USING btree (email);
CREATE INDEX idx_signup_attempts_ip ON public.signup_attempts USING btree (registration_ip);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (id, name, price, price_amount, currency, period, description, book_limit, features, is_active, display_order) VALUES
('free-trial', 'Free Trial', 'Free', 0, 'GBP', '7 days', 'Try our platform with 3 books for 7 days', 3, ARRAY['Access to 3 books', '7-day trial period', 'Basic reading features'], true, 1),
('basic-plan', 'Basic Plan', '£5.99', 599, 'GBP', 'per month', 'Perfect for casual readers', 10, ARRAY['Access to 10 books per month', 'Unlimited reading time', 'Bookmarks and progress tracking', 'Mobile and desktop access'], true, 2),
('premium-plan', 'Premium Plan', '£9.99', 999, 'GBP', 'per month', 'Unlimited access to our entire library', -1, ARRAY['Unlimited books', 'Early access to new releases', 'Advanced reading features', 'Priority customer support', 'Offline reading'], true, 3);

-- Commit the transaction
COMMIT;

-- Success message
SELECT 'Production database sync completed successfully!' as status;