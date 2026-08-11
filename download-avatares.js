const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");

const targetDir = "f:/www/99Frellas/yarinreels_web/public/avatares";
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const avatares = [
  // Atores e Atrizes - Usando a miniatura padronizada de 320px da Wikimedia
  { id: "wandinha.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Jenna_Ortega_at_the_2023_Golden_Globes.jpg/320px-Jenna_Ortega_at_the_2023_Golden_Globes.jpg" },
  { id: "peaky_blinders.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cillian_Murphy_2024_%28cropped%29.jpg/320px-Cillian_Murphy_2024_%28cropped%29.jpg" },
  { id: "eleven.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Millie_Bobby_Brown_2024.jpg/320px-Millie_Bobby_Brown_2024.jpg" },
  { id: "heisenberg.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Bryan_Cranston_2018.jpg/320px-Bryan_Cranston_2018.jpg" },
  { id: "geralt.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Henry_Cavill_2019.jpg/320px-Henry_Cavill_2019.jpg" },
  { id: "squid_game.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Lee_Jung-jae_2022.jpg/320px-Lee_Jung-jae_2022.jpg" },
  { id: "batman.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Christian_Bale_2019.jpg/320px-Christian_Bale_2019.jpg" },
  { id: "joker.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Joaquin_Phoenix_in_2018.jpg/320px-Joaquin_Phoenix_in_2018.jpg" },
  { id: "ironman.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg/320px-Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg" },
  { id: "kdrama_star.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Song_Hye-kyo_in_2023.jpg/320px-Song_Hye-kyo_in_2023.jpg" },
  { id: "kdrama_actor.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Gong_Yoo_in_2019.jpg/320px-Gong_Yoo_in_2019.jpg" },
  
  // Dubladores e Diretores (Animes) - 320px
  { id: "anime_hero.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Masako_Nozawa_2017.jpg/320px-Masako_Nozawa_2017.jpg" }, 
  { id: "cyber_anime.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Hiroyuki_Imaishi_-_2022_%28cropped%29.jpg/320px-Hiroyuki_Imaishi_-_2022_%28cropped%29.jpg" },
  { id: "jinx.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Ella_Purnell_by_Gage_Skidmore.jpg/320px-Ella_Purnell_by_Gage_Skidmore.jpg" }, 
  
  // MyAnimeList (Já estavam funcionando)
  { id: "saiyan.jpg", url: "https://cdn.myanimelist.net/images/characters/2/284121.jpg" }, 
  { id: "anime_boy.jpg", url: "https://cdn.myanimelist.net/images/characters/7/284129.jpg" }
];

// Função para pausar a execução e respeitar os limites da API (Throttling)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadAll() {
  console.log(`Iniciando download de ${avatares.length} avatares (com delay anti-bloqueio)...`);

  for (let i = 0; i < avatares.length; i++) {
    const a = avatares[i];
    const filePath = path.join(targetDir, a.id);
    
    // Pula o arquivo se ele já foi baixado com sucesso antes
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        console.log(`[IGNORADO] ${a.id} já existe.`);
        continue;
    }

    try {
      const res = await fetch(a.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} - ${res.statusText}`);
      }

      await pipeline(
        Readable.fromWeb(res.body),
        fs.createWriteStream(filePath)
      );

      console.log(`[SUCESSO] Baixado: ${a.id}`);
      
      // Aguarda 1.5 segundos antes da próxima requisição (exceto na última)
      if (i < avatares.length - 1) {
        await delay(1500); 
      }

    } catch (error) {
      console.error(`[ERRO] Falha ao baixar ${a.id}:`, error.message);
    }
  }
  
  console.log("\nDownload de todos os avatares no caminho F: CONCLUÍDO!");
}

downloadAll();