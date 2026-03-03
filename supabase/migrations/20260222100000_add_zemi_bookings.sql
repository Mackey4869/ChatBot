BEGIN;

-- 1) Create zemi_bookings table
CREATE TABLE public.zemi_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES public.zemi_slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','cancelled')) DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX zemi_bookings_slot_user_uq ON public.zemi_bookings (slot_id, user_id);
CREATE INDEX zemi_bookings_user_idx ON public.zemi_bookings (user_id);
CREATE INDEX zemi_bookings_slot_idx ON public.zemi_bookings (slot_id);

-- 2) Remove booked_count from zemi_slots (we'll rely on zemi_bookings counts)
ALTER TABLE public.zemi_slots DROP COLUMN IF EXISTS booked_count;

-- 3) Prevent overbooking using a BEFORE INSERT trigger that locks the slot row
CREATE OR REPLACE FUNCTION public.zemi_bookings_prevent_overbook() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_max INTEGER;
  v_booked INTEGER;
BEGIN
  SELECT max_capacity INTO v_max FROM public.zemi_slots WHERE id = NEW.slot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot does not exist';
  END IF;

  SELECT COUNT(*) INTO v_booked FROM public.zemi_bookings WHERE slot_id = NEW.slot_id AND status <> 'cancelled';

  IF v_booked >= v_max THEN
    RAISE EXCEPTION 'Slot is full';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER zemi_bookings_before_insert
BEFORE INSERT ON public.zemi_bookings
FOR EACH ROW EXECUTE FUNCTION public.zemi_bookings_prevent_overbook();

-- 4) Keep updated_at current on updates
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER zemi_bookings_set_updated_at
BEFORE UPDATE ON public.zemi_bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

COMMIT;
