--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: book_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.book_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    book_id character varying NOT NULL,
    category_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.book_categories OWNER TO neondb_owner;

--
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bookmarks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    book_id character varying NOT NULL,
    page integer NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.bookmarks OWNER TO neondb_owner;

--
-- Name: books; Type: TABLE; Schema: public; Owner: neondb_owner
--

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


ALTER TABLE public.books OWNER TO neondb_owner;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- Name: free_trial_abuse_prevention; Type: TABLE; Schema: public; Owner: neondb_owner
--

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


ALTER TABLE public.free_trial_abuse_prevention OWNER TO neondb_owner;

--
-- Name: reading_progress; Type: TABLE; Schema: public; Owner: neondb_owner
--

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


ALTER TABLE public.reading_progress OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: signup_attempts; Type: TABLE; Schema: public; Owner: neondb_owner
--

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


ALTER TABLE public.signup_attempts OWNER TO neondb_owner;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: neondb_owner
--

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


ALTER TABLE public.subscription_plans OWNER TO neondb_owner;

--
-- Name: user_selected_books; Type: TABLE; Schema: public; Owner: neondb_owner
--

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


ALTER TABLE public.user_selected_books OWNER TO neondb_owner;

--
-- Name: user_subscription_cycles; Type: TABLE; Schema: public; Owner: neondb_owner
--

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


ALTER TABLE public.user_subscription_cycles OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

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


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: book_categories book_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_pkey PRIMARY KEY (id);


--
-- Name: bookmarks bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_pkey PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_unique UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: free_trial_abuse_prevention free_trial_abuse_prevention_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.free_trial_abuse_prevention
    ADD CONSTRAINT free_trial_abuse_prevention_pkey PRIMARY KEY (id);


--
-- Name: reading_progress reading_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: signup_attempts signup_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.signup_attempts
    ADD CONSTRAINT signup_attempts_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: reading_progress unique_user_book; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT unique_user_book UNIQUE (user_id, book_id);


--
-- Name: user_selected_books user_selected_books_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_selected_books
    ADD CONSTRAINT user_selected_books_pkey PRIMARY KEY (id);


--
-- Name: user_subscription_cycles user_subscription_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_subscription_cycles
    ADD CONSTRAINT user_subscription_cycles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_device_fingerprint; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_device_fingerprint ON public.free_trial_abuse_prevention USING btree (device_fingerprint);


--
-- Name: idx_email_attempt; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_email_attempt ON public.signup_attempts USING btree (email, attempted_at);


--
-- Name: idx_email_domain; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_email_domain ON public.free_trial_abuse_prevention USING btree (email);


--
-- Name: idx_ip_attempt; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ip_attempt ON public.signup_attempts USING btree (registration_ip, attempted_at);


--
-- Name: idx_registration_ip; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_registration_ip ON public.free_trial_abuse_prevention USING btree (registration_ip);


--
-- Name: users_username_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username) WHERE (username IS NOT NULL);


--
-- Name: book_categories book_categories_book_id_books_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_book_id_books_id_fk FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_categories book_categories_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: bookmarks bookmarks_book_id_books_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_book_id_books_id_fk FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: bookmarks bookmarks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: free_trial_abuse_prevention free_trial_abuse_prevention_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.free_trial_abuse_prevention
    ADD CONSTRAINT free_trial_abuse_prevention_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reading_progress reading_progress_book_id_books_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_book_id_books_id_fk FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: reading_progress reading_progress_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_selected_books user_selected_books_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_selected_books
    ADD CONSTRAINT user_selected_books_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: user_selected_books user_selected_books_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_selected_books
    ADD CONSTRAINT user_selected_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_subscription_cycles user_subscription_cycles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_subscription_cycles
    ADD CONSTRAINT user_subscription_cycles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

