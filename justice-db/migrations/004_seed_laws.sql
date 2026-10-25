-- Starter statute content for OpenLegal: the fundamental rights provisions of
-- the 1999 Constitution (as amended). Before public launch, check each section
-- against the official text and load the full statutes with
-- justice-db/scripts/import-law.mjs.

INSERT INTO laws (slug, title, short_title, year, jurisdiction, category, description, source_url)
VALUES (
  'constitution-1999',
  'Constitution of the Federal Republic of Nigeria, 1999 (as amended)',
  'CFRN 1999',
  1999,
  'federal',
  'constitutional',
  'The supreme law of Nigeria. Chapter IV guarantees the fundamental rights every court must protect.',
  NULL
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO law_sections (law_id, part, number, heading, body, position)
SELECT l.id, 'Chapter IV — Fundamental Rights', s.number, s.heading, s.body, s.position
  FROM laws l,
       (VALUES
         (1, '33', 'Right to life',
          '(1) Every person has a right to life, and no one shall be deprived intentionally of his life, save in execution of the sentence of a court in respect of a criminal offence of which he has been found guilty in Nigeria.'),
         (2, '34', 'Right to dignity of human person',
          '(1) Every individual is entitled to respect for the dignity of his person, and accordingly – (a) no person shall be subject to torture or to inhuman or degrading treatment; (b) no person shall be held in slavery or servitude; and (c) no person shall be required to perform forced or compulsory labour.'),
         (3, '35', 'Right to personal liberty',
          '(1) Every person shall be entitled to his personal liberty and no person shall be deprived of such liberty save in the following cases and in accordance with a procedure permitted by law. … (4) Any person who is arrested or detained in accordance with subsection (1)(c) of this section shall be brought before a court of law within a reasonable time.'),
         (4, '36', 'Right to fair hearing',
          '(1) In the determination of his civil rights and obligations, including any question or determination by or against any government or authority, a person shall be entitled to a fair hearing within a reasonable time by a court or other tribunal established by law and constituted in such manner as to secure its independence and impartiality. … (5) Every person who is charged with a criminal offence shall be presumed to be innocent until he is proved guilty.'),
         (5, '37', 'Right to private and family life',
          'The privacy of citizens, their homes, correspondence, telephone conversations and telegraphic communications is hereby guaranteed and protected.'),
         (6, '38', 'Right to freedom of thought, conscience and religion',
          '(1) Every person shall be entitled to freedom of thought, conscience and religion, including freedom to change his religion or belief, and freedom (either alone or in community with others, and in public or in private) to manifest and propagate his religion or belief in worship, teaching, practice and observance.'),
         (7, '39', 'Right to freedom of expression and the press',
          '(1) Every person shall be entitled to freedom of expression, including freedom to hold opinions and to receive and impart ideas and information without interference.'),
         (8, '40', 'Right to peaceful assembly and association',
          'Every person shall be entitled to assemble freely and associate with other persons, and in particular he may form or belong to any political party, trade union or any other association for the protection of his interests.'),
         (9, '41', 'Right to freedom of movement',
          '(1) Every citizen of Nigeria is entitled to move freely throughout Nigeria and to reside in any part thereof, and no citizen of Nigeria shall be expelled from Nigeria or refused entry thereby or exit therefrom.'),
         (10, '46', 'Special jurisdiction of High Court',
          '(1) Any person who alleges that any of the provisions of this Chapter has been, is being or likely to be contravened in any State in relation to him may apply to a High Court in that State for redress.')
       ) AS s(position, number, heading, body)
 WHERE l.slug = 'constitution-1999'
ON CONFLICT (law_id, number) DO NOTHING;
