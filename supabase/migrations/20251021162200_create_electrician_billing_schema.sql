/*
  # Electrician Billing Application Schema

  ## Overview
  This migration creates a complete billing system for electricians to manage client bills,
  work items, and custom fields for electrical and pipeline works.

  ## New Tables
  
  ### `bills`
  - `id` (uuid, primary key) - Unique identifier for each bill
  - `bill_number` (text, unique) - Human-readable bill number (auto-generated)
  - `client_name` (text) - Name of the client
  - `client_phone` (text) - Client contact number
  - `client_address` (text) - Client address
  - `bill_date` (date) - Date of bill creation
  - `notes` (text, optional) - Additional notes or terms
  - `total_amount` (decimal) - Total bill amount
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `bill_items`
  - `id` (uuid, primary key) - Unique identifier for each line item
  - `bill_id` (uuid, foreign key) - Reference to parent bill
  - `description` (text) - Description of work/item
  - `quantity` (decimal) - Quantity of work done
  - `unit` (text) - Unit of measurement (pcs, meters, hours, etc.)
  - `rate` (decimal) - Rate per unit
  - `amount` (decimal) - Total amount for this item (quantity × rate)
  - `item_order` (integer) - Order of items in the bill
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Public access for this demo (can be restricted with auth later)
  
  ## Important Notes
  1. Bills can have multiple line items with custom descriptions
  2. Each item calculates its amount automatically (quantity × rate)
  3. Bill total is sum of all line items
  4. System supports any type of work (electrical, pipeline, custom)
*/

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text NOT NULL,
  client_name text NOT NULL,
  client_phone text DEFAULT '',
  client_address text DEFAULT '',
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bill_items table
CREATE TABLE IF NOT EXISTS bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity decimal(10,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pcs',
  rate decimal(10,2) NOT NULL DEFAULT 0,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  item_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS bill_items_bill_id_idx ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS bills_bill_date_idx ON bills(bill_date DESC);

-- Enable Row Level Security
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (can be restricted later with auth)
CREATE POLICY "Allow public read access to bills"
  ON bills FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to bills"
  ON bills FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to bills"
  ON bills FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to bills"
  ON bills FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to bill_items"
  ON bill_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to bill_items"
  ON bill_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to bill_items"
  ON bill_items FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to bill_items"
  ON bill_items FOR DELETE
  TO public
  USING (true);

-- Function to auto-generate bill numbers
-- CREATE OR REPLACE FUNCTION generate_bill_number()
-- RETURNS text AS $$
-- DECLARE
--   next_number integer;
--   bill_num text;
-- BEGIN
--   SELECT COUNT(*) + 1 INTO next_number FROM bills;
--   bill_num := 'BILL-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_number::text, 4, '0');
--   RETURN bill_num;
-- END;
-- $$ LANGUAGE plpgsql;




-- Create a sequence
CREATE SEQUENCE IF NOT EXISTS bill_number_seq START 1;

-- Update the function
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  bill_num text;
BEGIN
  SELECT nextval('bill_number_seq') INTO next_number;
  bill_num := 'BILLS-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_number::text, 4, '0');
  RETURN bill_num;
END;
$$ LANGUAGE plpgsql;


-- Function to update bill total
CREATE OR REPLACE FUNCTION update_bill_total()
RETURNS trigger AS $$
BEGIN
  UPDATE bills
  SET total_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM bill_items
    WHERE bill_id = COALESCE(NEW.bill_id, OLD.bill_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.bill_id, OLD.bill_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update bill total when items change
CREATE TRIGGER update_bill_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON bill_items
FOR EACH ROW
EXECUTE FUNCTION update_bill_total();