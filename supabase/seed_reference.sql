-- Données de référence VICE CITY NEWS (sans contenu premium)
insert into public.categories (slug, name, color, emoji, sort) values
  ('actus', 'Actus', '#ff2e88', '📰', 1),
  ('secrets', 'Secrets', '#7b2ff7', '🔍', 2),
  ('gameplay', 'Gameplay', '#00e5ff', '🎮', 3),
  ('business', 'Business', '#ffd23f', '💰', 4),
  ('leaks', 'Leaks', '#ff5a5f', '🕵️', 5),
  ('analyses', 'Analyses', '#ff8a3d', '🧠', 6),
  ('evenements', 'Événements', '#2ee59d', '🏆', 7)
on conflict (slug) do nothing;

insert into public.map_categories (slug, name, color, emoji, sort) values
  ('region', 'Régions', '#00e5ff', '🌴', 1),
  ('lieu', 'Lieux', '#ff2e88', '📍', 2),
  ('easter', 'Easter eggs', '#ffd23f', '🥚', 3),
  ('secret', 'Secrets', '#7b2ff7', '🔐', 4)
on conflict (slug) do nothing;

insert into public.app_settings (key, value, is_public) values
  ('price_monthly', '{"amount": 299, "currency": "eur", "label": "2,99 €"}', true),
  ('price_yearly', '{"amount": 2499, "currency": "eur", "label": "24,99 €"}', true),
  ('ticker', '["GTA 6 est disponible sur PS5 et Xbox Series X|S", "99 sur Metacritic : record égalé", "32,5 millions de précommandes selon Rockstar", "Pas encore de date pour la version PC", "Game Awards : 8 nominations pour GTA 6"]', true)
on conflict (key) do nothing;
