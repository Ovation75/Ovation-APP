-- ============================================================================
-- Demo catalogue seed for public.shows / public.show_venues
-- ----------------------------------------------------------------------------
-- The real `shows` table was empty, so the mocked Feed cards and Fiche
-- Spectacle reviews had no real ids to link to. This inserts the 9 demo shows
-- with FIXED uuids that must match lib/demoCatalogueIds.ts — after running it,
-- tapping a Feed/discovery card or opening a show with mock reviews resolves to
-- a real row instead of "Spectacle introuvable".
--
-- Review, then run yourself. Idempotent: shows use ON CONFLICT DO NOTHING, and
-- each show's venues are cleared before re-insert so a second run is a no-op.
-- Note: `shows` has no artist/company column in the schema, so the mock
-- `company` field is not seeded.
-- ============================================================================

begin;

insert into public.shows (id, title, genre, synopsis, status) values
  ('835a4a88-5998-4d56-81c9-765302a624fb', 'Le Malade imaginaire', 'theatre_classique',
   'Argan, obsédé par sa santé, se croit accablé de mille maux. Entouré de médecins peu scrupuleux et d''une servante à l''esprit vif, il veut marier sa fille à un médecin. Une comédie-ballet où Molière rit de la médecine de son temps et de nos propres peurs.',
   'ongoing'),
  ('ab0248cc-ee9c-4954-9b75-5ae0a79a32a6', 'Cyrano de Bergerac', 'theatre_classique',
   'Poète au panache flamboyant et au nez proéminent, Cyrano aime en secret la belle Roxane. Il prête sa plume et son esprit au fade Christian pour la séduire. Un chef-d''œuvre de tirades et d''émotion, entre bravoure et renoncement.',
   'touring'),
  ('48d0be2a-4bad-48dc-ab06-48ece15370e4', 'En attendant Godot', 'contemporain',
   'Sur une route déserte, Vladimir et Estragon attendent un certain Godot qui ne vient jamais. Entre jeux de langage et silences, Beckett signe une méditation drôle et vertigineuse sur l''attente et le sens de l''existence.',
   'finished'),
  ('36545100-9590-4f60-8913-91ffc6faf53d', 'La Cantatrice chauve', 'contemporain',
   'Deux couples anglais échangent des banalités qui dérapent vers le non-sens le plus total. Ionesco fait exploser le langage et la logique dans cette ''anti-pièce'' devenue culte.',
   'ongoing'),
  ('1cf77c46-4018-4b6d-9411-a5d82dc065c6', 'Roméo et Juliette', 'theatre_classique',
   'À Vérone, deux familles ennemies. Roméo et Juliette s''aiment envers et contre tous. Une tragédie de la passion et du destin, portée par une mise en scène épurée.',
   'ongoing'),
  ('4434a701-65dd-480b-98c2-ce88eb1e8e04', 'Huis clos', 'contemporain',
   'Trois personnages se retrouvent enfermés ensemble pour l''éternité. ''L''enfer, c''est les autres'' : Sartre dissèque le regard d''autrui dans un huis clos implacable.',
   'touring'),
  ('6e69ad97-93b3-4d8f-b866-f68c20871476', 'Un stand-up presque parfait', 'stand_up',
   'Une heure de vannes affûtées sur la vie parisienne, les applis de rencontre et la famille. Léa Fontaine confirme qu''elle est l''une des voix montantes du stand-up.',
   'ongoing'),
  ('57affd75-cc51-4129-9154-97aaf547b8ab', 'Le Dîner de cons', 'comedie',
   'Chaque semaine, des amis organisent un dîner où chacun amène un ''con''. Mais ce soir, le con pourrait bien renverser la partie. Une mécanique comique implacable.',
   'ongoing'),
  ('c4373d1a-a94c-495d-a581-68159f2ca637', 'Dom Juan', 'theatre_classique',
   'Libertin insatiable et provocateur, Dom Juan brave le ciel, les femmes et les conventions, entraînant son valet Sganarelle dans une fuite en avant vertigineuse. Molière signe une comédie sombre où l''insolence défie jusqu''au surnaturel.',
   'ongoing')
on conflict (id) do nothing;

-- Venues: clear then re-insert for these shows so re-running stays idempotent.
delete from public.show_venues where show_id in (
  '835a4a88-5998-4d56-81c9-765302a624fb',
  'ab0248cc-ee9c-4954-9b75-5ae0a79a32a6',
  '48d0be2a-4bad-48dc-ab06-48ece15370e4',
  '36545100-9590-4f60-8913-91ffc6faf53d',
  '1cf77c46-4018-4b6d-9411-a5d82dc065c6',
  '4434a701-65dd-480b-98c2-ce88eb1e8e04',
  '6e69ad97-93b3-4d8f-b866-f68c20871476',
  '57affd75-cc51-4129-9154-97aaf547b8ab',
  'c4373d1a-a94c-495d-a581-68159f2ca637'
);

insert into public.show_venues (show_id, venue_name, city) values
  ('835a4a88-5998-4d56-81c9-765302a624fb', 'Théâtre du Palais-Royal', 'Paris'),
  ('ab0248cc-ee9c-4954-9b75-5ae0a79a32a6', 'Théâtre de la Porte Saint-Martin', 'Paris'),
  ('ab0248cc-ee9c-4954-9b75-5ae0a79a32a6', 'Espace Cardin', 'Paris'),
  ('48d0be2a-4bad-48dc-ab06-48ece15370e4', 'Théâtre de la Bastille', 'Paris'),
  ('36545100-9590-4f60-8913-91ffc6faf53d', 'Théâtre de la Huchette', 'Paris'),
  ('1cf77c46-4018-4b6d-9411-a5d82dc065c6', 'Comédie-Française', 'Paris'),
  ('4434a701-65dd-480b-98c2-ce88eb1e8e04', 'Théâtre de Poche-Montparnasse', 'Paris'),
  ('6e69ad97-93b3-4d8f-b866-f68c20871476', 'Le Point Virgule', 'Paris'),
  ('57affd75-cc51-4129-9154-97aaf547b8ab', 'Théâtre des Variétés', 'Paris'),
  ('c4373d1a-a94c-495d-a581-68159f2ca637', 'Théâtre du Vieux-Colombier', 'Paris');

commit;
