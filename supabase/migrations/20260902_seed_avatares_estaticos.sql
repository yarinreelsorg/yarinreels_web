-- Os 16 avatares "de fábrica" (Wandinha, Tommy Shelby, Geralt etc.) viviam
-- só hardcoded em src/lib/avatares.ts, fora do alcance do Gerenciador de
-- Avatares do admin — dava pra criar/editar/excluir avatares customizados
-- pelo painel, mas não os originais, que sempre reapareciam (o front
-- mesclava a lista do banco com essa lista fixa do código). Migra pra
-- dentro da tabela AVATARES, que já é totalmente gerenciável pelo admin,
-- assim o botão "excluir" passa a valer pra qualquer avatar.
create unique index if not exists avatares_url_foto_unica_idx on "AVATARES" (ds_url_foto);

insert into "AVATARES" (nm_avatar, nm_categoria, ds_url_foto, nr_ordem, fl_ativo)
values
  ('Wandinha Addams', '🎬 Séries & Atores', '/avatares/wandinha.jpg', 0, true),
  ('Tommy Shelby', '🎬 Séries & Atores', '/avatares/peaky_blinders.jpg', 1, true),
  ('Eleven (Stranger Things)', '🎬 Séries & Atores', '/avatares/eleven.jpg', 2, true),
  ('Walter White (Breaking Bad)', '🎬 Séries & Atores', '/avatares/heisenberg.jpg', 3, true),
  ('Geralt (The Witcher)', '🎬 Séries & Atores', '/avatares/geralt.jpg', 4, true),
  ('Guardião (Round 6)', '🎬 Séries & Atores', '/avatares/squid_game.jpg', 5, true),
  ('Guerriro Anime', '🐉 Animes & Animações', '/avatares/anime_hero.jpg', 6, true),
  ('Cyberpunk Anime', '🐉 Animes & Animações', '/avatares/cyber_anime.jpg', 7, true),
  ('Super Saiyajin', '🐉 Animes & Animações', '/avatares/saiyan.jpg', 8, true),
  ('Jinx (Arcane)', '🐉 Animes & Animações', '/avatares/jinx.jpg', 9, true),
  ('Protagonista Anime', '🐉 Animes & Animações', '/avatares/anime_boy.jpg', 10, true),
  ('Estrela K-Drama', '💖 Doramas & K-Dramas', '/avatares/kdrama_star.jpg', 11, true),
  ('Galã de Dorama', '💖 Doramas & K-Dramas', '/avatares/kdrama_actor.jpg', 12, true),
  ('Cavaleiro das Trevas', '🦸‍♂️ Heróis & Vilões', '/avatares/batman.jpg', 13, true),
  ('Coringa Neon', '🦸‍♂️ Heróis & Vilões', '/avatares/joker.jpg', 14, true),
  ('Homem de Ferro', '🦸‍♂️ Heróis & Vilões', '/avatares/ironman.jpg', 15, true)
on conflict (ds_url_foto) do nothing;
