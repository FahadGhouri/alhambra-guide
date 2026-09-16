import os
import time
import urllib.request
from io import BytesIO
from PIL import Image

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "photos")
os.makedirs(OUT_DIR, exist_ok=True)

UA = "AlhambraGuidePWA/1.0 (personal travel app; contact: ghourifahad@hotmail.com)"

# (local_filename, source_url)
PHOTOS = [
    ("puerta-granadas-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/16/Puerta_de_las_Granadas_%28Granada%29.jpg"),
    ("puerta-granadas-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/7d/Granada%2C_Puerta_de_las_Granadas_%281%29.jpg"),

    ("puerta-justicia-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/11/Puerta_de_la_Justicia%2C_o_Bab_al-Shari%27a_%28la_Alhambra%29.jpg"),
    ("puerta-justicia-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/f/fd/Granada-Alhambra-Puerta_de_la_Justicia-1.JPG"),

    ("puerta-vino-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/f/f2/Puerta_del_Vino-Alhambra.jpg"),
    ("puerta-vino-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/a2/Puerta_del_Vino_exterieur.jpg"),

    ("aljibes-alcazaba-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/8a/Alcazaba_Alhambra_Granada_Spain.jpg"),
    ("aljibes-alcazaba-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/bc/Torre_de_la_Vela_Alhambra.jpg"),

    ("mexuar-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/27/Mexuar_Alhambra_Granada_Spain.jpg"),
    ("mexuar-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/64/Granada_-_Alhambra_-_Palacios_nazar%C3%ADes_-_Sala_del_Mexuar_-_Azulejos.jpg"),

    ("cuarto-dorado-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/21/Granada_-_Alhambra_-_Palacios_nazar%C3%ADes_-_Fa%C3%A7ade_of_Comares_-_2.jpg"),
    ("cuarto-dorado-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/63/Window%2C_Nasrid_motto%2C_Cuarto_Dorado%2C_Alhambra%2C_Granada%2C_Spain.jpg"),

    ("patio-arrayanes-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/da/Patio_de_los_Arrayanes_Alhambra_2014.jpg"),
    ("patio-arrayanes-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/6f/Granada_-_Alhambra_-_Palacios_nazar%C3%ADes_-_Patio_de_los_Arrayanes.jpg"),

    ("sala-barca-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/78/Alhambra_Sala_de_la_Barca_DSCF8259.jpg"),
    ("sala-barca-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/5e/Alhambra_Sala_de_la_Barca_%28R_Prazeres%29_DSCF8213.jpg"),

    ("salon-embajadores-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/56/Granada_-_Alhambra_-_Palacios_nazar%C3%ADes_-_Sal%C3%B3n_de_Embajadores.jpg"),
    ("salon-embajadores-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/cb/Alhambra_Comares_Hall_%28R_Prazeres%29_DSCF6579.jpg"),

    ("patio-leones-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/d5/Fuente_de_los_Leones_%28Patio_de_los_Leones%29._La_Alhambra.jpg"),
    ("patio-leones-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/40/Granada_-_Alhambra%2C_Palacio_de_los_Leones%2C_Fuente_del_patio_1.jpg"),

    ("sala-abencerrajes-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/a8/Toit_salle_Abencerrages_Alhambra_Espagne.jpg"),
    ("sala-abencerrajes-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/85/Sala_de_los_Abencerrajes-Alhambra_%281%29.jpg"),

    ("sala-reyes-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/32/Granada_-_Alhambra_-_Palacios_nazar%C3%ADes_-_Sala_de_los_Reyes_-_1.jpg"),
    ("sala-reyes-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/d6/Granada_-_Alhambra_-_Palacios_nazar%C3%ADes_-_Sala_de_los_Reyes_-_3.jpg"),

    ("sala-dos-hermanas-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/2/24/C%C3%BApula_de_la_sala_de_las_Dos_Hermanas_%28Alhambra%2C_Granada%29.jpg"),
    ("sala-dos-hermanas-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/41/2016-07-12_Sala_de_dos_Hermanas%2C_Patio_de_los_Leones.JPG"),

    ("mirador-lindaraja-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/c0/Mirador_de_Lindaraja%2C_la_Alhambra_%28Granada%29.jpg"),
    ("mirador-lindaraja-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/10/Techo_del_Mirador_de_Lindaraja_%28la_Alhambra%29.jpg"),

    ("emperor-chambers-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b7/Alhambra_Patio_de_la_Lindaraja_Nasrid_Garden_2014.jpg"),
    ("emperor-chambers-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/45/Patio_de_la_Reja.jpg"),

    ("partal-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/53/El_Partal_Alhambra_2014.jpg"),
    ("partal-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b0/Torre_de_las_Damas%2C_la_Alhambra_%28Granada%29.jpg"),

    ("paseo-torres-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/13/Alhambra_Torre_de_las_Infantas_DSCF7947.jpg"),
    ("paseo-torres-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/76/Tower_of_the_Princesses%2C_Alhambra%2C_from_Generalife_gardens%2C_Granada%2C_Spain.jpg"),

    ("generalife-jardines-nuevos-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/aa/2016-07-19_Jardines_Nuevos%2C_The_Generalife%2C_Alhambra_%281%29.JPG"),
    ("generalife-jardines-nuevos-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/72/Alhambra_from_Generalife_%282017%29.jpg"),

    ("patio-acequia-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/5b/Granada_-_Generalife_-_Patio_de_la_Acequia_-_1.jpg"),
    ("patio-acequia-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/0/0e/Patio_de_la_Acequia_Generalife_1_Grenade.jpg"),

    ("patio-sultana-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/8d/Patio_de_la_Sultana_fountain_Generalife_Granada_Spain.jpg"),
    ("patio-sultana-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1f/Patio_de_la_Sultana_detail_Generalife_Granada_Spain.jpg"),

    ("escalera-agua-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/5c/Escalera_del_Agua_-_Generalife%2C_Granada%2C_Spain_-_DSC07840.JPG"),
    ("escalera-agua-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b0/Paseo_de_las_Adelfas%2C_Granada%2C_Espa%C3%B1a.jpg"),

    ("calle-real-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/7e/Church_Santa_Mar%C3%ADa_de_la_Alhambra_2014.jpg"),
    ("calle-real-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b9/Granada-La_Alhambra-31-Techo_del_Ba%C3%B1o_de_la_Mezquita-20110920-10230.jpg"),

    ("palacio-carlos-v-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/d2/Patio_del_Palacio_de_Carlos_V_%28Granada%29.jpg"),
    ("palacio-carlos-v-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/3/31/Palacio_de_Carlos_V_%28Alhambra%29%2C_puerta_de_la_fachada_oeste.jpg"),

    ("mirador-san-nicolas-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/cf/Alhambra_evening_panorama_Mirador_San_Nicolas_sRGB-1.jpg"),
    ("mirador-san-nicolas-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/1e/Granada_-_View_from_Mirador_de_San_Nicol%C3%A1s_-_02.jpg"),
]

MAX_W = 1100
JPEG_QUALITY = 78

def fetch_and_save(fname, url):
    dest = os.path.join(OUT_DIR, fname)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    img = Image.open(BytesIO(data))
    img = img.convert("RGB")
    if img.width > MAX_W:
        h = int(img.height * (MAX_W / img.width))
        img = img.resize((MAX_W, h), Image.LANCZOS)
    img.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True)
    size_kb = os.path.getsize(dest) / 1024
    print(f"OK  {fname}  {img.width}x{img.height}  {size_kb:.0f}KB")

def main():
    failed = []
    for fname, url in PHOTOS:
        dest = os.path.join(OUT_DIR, fname)
        if os.path.exists(dest):
            continue
        for attempt in range(3):
            try:
                fetch_and_save(fname, url)
                time.sleep(0.3)
                break
            except Exception as e:
                print(f"RETRY {fname} attempt {attempt+1}: {e}")
                time.sleep(1.5)
        else:
            failed.append((fname, url))
    if failed:
        print("\nFAILED:")
        for f, u in failed:
            print(" ", f, u)
    else:
        print("\nAll photos downloaded OK.")

if __name__ == "__main__":
    main()
