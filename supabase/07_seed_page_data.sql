insert into public.guild_members (name, role, specialty, fame, last_active, online, avatar, avatar_tone)
values
  ('IronWarden', 'Guild Master', 'Shot Caller', '184.2M', 'Online now', true, 'IW', 'gold'),
  ('LunaVex', 'Officer', 'Healer · Holy', '142.8M', 'Online now', true, 'LV', 'violet'),
  ('GrimHollow', 'Officer', 'Tank · Maces', '126.5M', 'Online now', true, 'GH', 'ember'),
  ('AshenFang', 'Veteran', 'DPS · Axes', '98.1M', 'Online now', true, 'AF', 'rose'),
  ('Thornweaver', 'Veteran', 'Healer · Nature', '86.4M', 'Online now', true, 'TW', 'sage'),
  ('RookAndRuin', 'Veteran', 'Gatherer · Ore', '74.9M', '2 hours ago', false, 'RR', 'blue'),
  ('VelvetDagger', 'Member', 'DPS · Daggers', '63.2M', '5 hours ago', false, 'VD', 'violet'),
  ('Mossbound', 'Member', 'Gatherer · Fiber', '48.7M', 'Yesterday', false, 'MB', 'sage'),
  ('CinderVale', 'Member', 'Crafter · Armor', '39.3M', 'Yesterday', false, 'CV', 'ember'),
  ('Oathkeeper', 'Member', 'Tank · Shields', '28.6M', '2 days ago', false, 'OK', 'gold'),
  ('BlueMorrow', 'Member', 'Gatherer · Hide', '16.8M', '3 days ago', false, 'BM', 'blue'),
  ('QuietTempest', 'Member', 'DPS · Bows', '9.4M', '4 days ago', false, 'QT', 'rose')
on conflict (name) do nothing;

insert into public.guild_rules (title, category, description)
select seed.title, seed.category, seed.description
from (values
  ('Respect every member', 'Community', 'Treat all guild members with respect. Harassment and disruptive behavior are not welcome.'),
  ('Keep comms clear', 'Communication', 'Keep voice and text channels useful for the group, especially during organized content.'),
  ('Follow the shot caller', 'Guild events', 'During group fights and events, listen to the designated shot caller and follow their instructions.'),
  ('Be prepared for events', 'Guild events', 'Bring the requested equipment and supplies when joining scheduled guild activities.')
) as seed(title, category, description)
where not exists (
  select 1 from public.guild_rules existing where existing.title = seed.title
);

insert into public.guild_guides (title, category, summary, content)
select seed.title, seed.category, seed.summary, seed.content
from (values
  ('Getting started in the Covenant', 'New members', 'A quick introduction to the guild and how to get involved.', 'Welcome to New Era Youths. Check the guild announcements, introduce yourself to the community, and ask an officer if you need help getting started.'),
  ('Preparing for group content', 'Activities', 'What to bring and check before joining a group activity.', 'Before group content, repair your equipment, bring the requested build and consumables, and make sure you have enough time to participate. Follow the event leader instructions.'),
  ('Build basics', 'Equipment', 'How to choose a role and prepare an equipment loadout.', 'Choose a role that fits the activity, then review the guild build collection for equipment and skills. If you are unsure which build to use, ask the group leader before the activity begins.'),
  ('Gathering safely', 'Gathering', 'Simple reminders for safer resource gathering trips.', 'Check the destination before leaving, bring equipment suited to the area, and stay aware of your surroundings. Travel with guildmates when possible and return to safety if conditions change.')
) as seed(title, category, summary, content)
where not exists (
  select 1 from public.guild_guides existing where existing.title = seed.title
);

insert into public.guild_builds (name, role, style, description, specialty)
values
  ('Covenant War Build', 'Balanced', 'PvP', 'Balanced front-line setup for group fights.', 'Tank · Shields'),
  ('Holy Support', 'Healer', 'PvP', 'Fast support build for reliable healing.', 'Healer · Holy'),
  ('Nature Healer', 'Healer', 'ZvZ', 'Large-scale healing and utility build.', 'Healer · Nature'),
  ('Dagger Assassin', 'Damage', 'PvP', 'Mobile burst damage for small skirmishes.', 'DPS · Daggers'),
  ('Longbow Marksman', 'Damage', 'PvE', 'Safe ranged damage for PvE content.', 'DPS · Bows'),
  ('Ore Gatherer', 'Gatherer', 'Gathering', 'Durable gathering setup for resource runs.', 'Gatherer · Ore')
on conflict (name) do nothing;
