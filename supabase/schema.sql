-- Enable UUID extension
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  cafe_name text not null default '',
  city text not null default '',
  subscription_plan text not null default 'free' check (subscription_plan in ('free','pro')),
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;
create policy "users: own row" on public.users using (auth.uid() = id);

create table if not exists public.cafe_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  monthly_rent numeric not null default 0,
  staff_salary numeric not null default 0,
  utilities numeric not null default 0,
  other_costs numeric not null default 0,
  tax_percent numeric not null default 9,
  food_daily_qty integer not null default 0,
  drink_daily_qty integer not null default 0,
  working_days integer not null default 26,
  unique(user_id)
);
alter table public.cafe_settings enable row level security;
create policy "cafe_settings: own row" on public.cafe_settings using (auth.uid() = user_id);

create table if not exists public.library_ingredients (
  id uuid primary key default gen_random_uuid(),
  name_fa text not null,
  name_en text not null,
  category text not null,
  default_unit text not null
);

create table if not exists public.library_menu_items (
  id uuid primary key default gen_random_uuid(),
  name_fa text not null,
  name_en text not null,
  category text not null,
  type text not null check (type in ('food','drink')),
  default_recipe jsonb not null default '{}'::jsonb
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  library_id uuid references public.library_ingredients(id),
  name text not null,
  category text not null default '',
  price numeric not null default 0,
  unit text not null default 'گرم',
  quantity numeric not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.ingredients enable row level security;
create policy "ingredients: own rows" on public.ingredients using (auth.uid() = user_id);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  library_id uuid references public.library_menu_items(id),
  name text not null,
  type text not null check (type in ('food','drink')),
  selling_price numeric not null default 0,
  total_cost numeric not null default 0,
  profit_percent numeric not null default 0
);
alter table public.menu_items enable row level security;
create policy "menu_items: own rows" on public.menu_items using (auth.uid() = user_id);

create table if not exists public.menu_ingredients (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  amount numeric not null default 0,
  unit text not null,
  cost numeric not null default 0
);
alter table public.menu_ingredients enable row level security;
create policy "menu_ingredients: via menu_items" on public.menu_ingredients
  using (exists (select 1 from public.menu_items m where m.id = menu_item_id and m.user_id = auth.uid()));

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "notifications: own rows" on public.notifications using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.library_ingredients (name_fa, name_en, category, default_unit) values
  ('شیر', 'Milk', 'لبنیات', 'میلی‌لیتر'),
  ('خامه', 'Cream', 'لبنیات', 'میلی‌لیتر'),
  ('پنیر', 'Cheese', 'لبنیات', 'گرم'),
  ('تخم‌مرغ', 'Egg', 'پروتئین', 'عدد'),
  ('آرد', 'Flour', 'خشکبار', 'گرم'),
  ('شکر', 'Sugar', 'خشکبار', 'گرم'),
  ('قهوه', 'Coffee', 'نوشیدنی', 'گرم'),
  ('چای', 'Tea', 'نوشیدنی', 'گرم'),
  ('کره', 'Butter', 'لبنیات', 'گرم'),
  ('نمک', 'Salt', 'ادویه', 'گرم'),
  ('روغن', 'Oil', 'روغن', 'میلی‌لیتر'),
  ('مرغ', 'Chicken', 'پروتئین', 'گرم'),
  ('گوشت', 'Beef', 'پروتئین', 'گرم'),
  ('گوجه', 'Tomato', 'سبزیجات', 'گرم'),
  ('پیاز', 'Onion', 'سبزیجات', 'گرم'),
  ('سیب زمینی', 'Potato', 'سبزیجات', 'گرم'),
  ('شکلات', 'Chocolate', 'خشکبار', 'گرم'),
  ('وانیل', 'Vanilla', 'ادویه', 'گرم'),
  ('دارچین', 'Cinnamon', 'ادویه', 'گرم'),
  ('عسل', 'Honey', 'شیرینی', 'گرم')
on conflict do nothing;

insert into public.library_menu_items (name_fa, name_en, category, type, default_recipe) values
  ('اسپرسو', 'Espresso', 'قهوه', 'drink', '{"ingredients":[{"name_fa":"قهوه","amount":18,"unit":"گرم"}]}'),
  ('کاپوچینو', 'Cappuccino', 'قهوه', 'drink', '{"ingredients":[{"name_fa":"قهوه","amount":18,"unit":"گرم"},{"name_fa":"شیر","amount":150,"unit":"میلی‌لیتر"}]}'),
  ('لاته', 'Latte', 'قهوه', 'drink', '{"ingredients":[{"name_fa":"قهوه","amount":18,"unit":"گرم"},{"name_fa":"شیر","amount":200,"unit":"میلی‌لیتر"}]}'),
  ('ماکیاتو', 'Macchiato', 'قهوه', 'drink', '{"ingredients":[{"name_fa":"قهوه","amount":18,"unit":"گرم"},{"name_fa":"شیر","amount":30,"unit":"میلی‌لیتر"}]}'),
  ('ساندویچ مرغ', 'Chicken Sandwich', 'ساندویچ', 'food', '{"ingredients":[{"name_fa":"مرغ","amount":120,"unit":"گرم"},{"name_fa":"آرد","amount":50,"unit":"گرم"}]}'),
  ('پیتزا مارگاریتا', 'Margherita Pizza', 'پیتزا', 'food', '{"ingredients":[{"name_fa":"آرد","amount":200,"unit":"گرم"},{"name_fa":"پنیر","amount":100,"unit":"گرم"},{"name_fa":"گوجه","amount":80,"unit":"گرم"}]}'),
  ('کیک شکلاتی', 'Chocolate Cake', 'کیک', 'food', '{"ingredients":[{"name_fa":"شکلات","amount":100,"unit":"گرم"},{"name_fa":"آرد","amount":150,"unit":"گرم"},{"name_fa":"تخم‌مرغ","amount":3,"unit":"عدد"},{"name_fa":"کره","amount":80,"unit":"گرم"}]}'),
  ('چای ایرانی', 'Persian Tea', 'چای', 'drink', '{"ingredients":[{"name_fa":"چای","amount":5,"unit":"گرم"}]}')
on conflict do nothing;
