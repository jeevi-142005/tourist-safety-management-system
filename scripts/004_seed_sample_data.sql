-- Insert sample countries
insert into public.countries (name, code, safety_level, description) values
  ('United States', 'US', 4, 'Generally safe with good infrastructure and healthcare.'),
  ('United Kingdom', 'GB', 4, 'Very safe with excellent healthcare and infrastructure.'),
  ('Japan', 'JP', 5, 'Extremely safe with low crime rates and excellent infrastructure.'),
  ('Thailand', 'TH', 3, 'Popular tourist destination with some areas requiring caution.'),
  ('Mexico', 'MX', 2, 'Beautiful destinations but some areas have safety concerns.'),
  ('France', 'FR', 4, 'Generally safe with good infrastructure, watch for pickpockets in tourist areas.')
on conflict (code) do nothing;

-- Insert sample safety alerts
insert into public.safety_alerts (country_id, title, description, severity) 
select 
  c.id,
  'Travel Advisory Update',
  'Please check current travel advisories before visiting.',
  'medium'
from public.countries c
where c.code in ('MX', 'TH')
on conflict do nothing;

-- Insert sample travel tips
insert into public.travel_tips (country_id, title, content, category)
select 
  c.id,
  'Local Emergency Numbers',
  'Always save local emergency contact numbers in your phone.',
  'safety'
from public.countries c
on conflict do nothing;
