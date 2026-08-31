-- Página imersiva estilo TikTok/Reels (/trailer/[id]) pra tráfego de anúncio
-- mobile: precisa de um clipe já cortado em 9:16 pra preencher a tela
-- vertical sem distorcer/cortar feio, diferente do trailer do YouTube
-- (ds_url_trailer_youtube), que é horizontal. Hospedado na Bunny, mesmo
-- CDN/player customizado (HLS/mp4) já usado pro resto do site.
alter table "CONTEUDOS" add column if not exists ds_url_teaser_vertical text;
