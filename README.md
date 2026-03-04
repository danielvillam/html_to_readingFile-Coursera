# HTML → Markdown Converter

Una plataforma web estática que convierte el HTML de artículos de Coursera (generados con Astro) en archivos `.md` listos para descargar.

---

## ¿Qué hace?

Al estudiar en Coursera, los materiales de lectura se presentan como páginas HTML con una estructura estándar basada en Astro. Esta herramienta permite:

1. **Pegar** el HTML del artículo en el área de entrada.
2. **Convertir** automáticamente el contenido a Markdown limpio.
3. **Descargar** el archivo `.md` generado, con nombre derivado del título del artículo y frontmatter YAML incluido (`title` y `date`).

El objetivo es facilitar la creación de notas personales o materiales de estudio en formato Markdown, compatible con herramientas como Obsidian, Notion, Jekyll, etc.

---

## Estructura HTML soportada

La herramienta espera el siguiente patrón estándar de Coursera/Astro:

```html
<main data-astro-cid-...>
  <article>
    <header>
      <h1>Título del artículo</h1>
    </header>
    <hr>
    <p>Párrafo introductorio...</p>
    <h2 id="seccion">Sección</h2>
    <p>Contenido...</p>
    <ol>
      <li>Elemento 1</li>
      <li>Elemento 2</li>
    </ol>
    <!-- más bloques: ul, blockquote, pre, hr, etc. -->
  </article>
</main>
```

### Elementos convertidos

| HTML            | Markdown generado      |
|-----------------|------------------------|
| `<h1>`          | `# Título`             |
| `<h2>`          | `## Sección`           |
| `<h3>`          | `### Subsección`       |
| `<p>`           | Párrafo de texto       |
| `<ol> / <li>`   | Lista numerada `1.`    |
| `<ul> / <li>`   | Lista con viñetas `-`  |
| `<strong>`      | `**negrita**`          |
| `<em>`          | `*cursiva*`            |
| `<code>`        | `` `código` ``         |
| `<a href="">`   | `[texto](url)`         |
| `<pre><code>`   | Bloque de código fenced|
| `<blockquote>`  | `> cita`               |
| `<hr>`          | `---`                  |

---

## Uso

### En línea (GitHub Pages)

Visita la plataforma desplegada en:

```
https://danielvillam.github.io/html_to_readingFile-Coursera/
```

1. Abre el artículo de Coursera en el navegador.
2. Copia el HTML del artículo (inspecciona el elemento `<main>` o `<article>` con las DevTools).
3. Pégalo en el área **Entrada HTML**.
4. Pulsa **Convertir**.
5. Revisa la vista previa y pulsa **Descargar .md**.

### En local

Solo necesitas un navegador; no hay dependencias ni servidor requerido.

```bash
git clone https://github.com/danielvillam/html_to_readingFile-Coursera.git
cd html_to_readingFile-Coursera
# Abre index.html en tu navegador
open index.html   # macOS
start index.html  # Windows
```

---

## Estructura del proyecto

```
html_to_readingFile-Coursera/
├── index.html      # Interfaz de usuario
├── style.css       # Estilos (CSS vanilla, sin dependencias)
├── converter.js    # Lógica de conversión HTML → Markdown
└── README.md       # Este archivo
```

---

## Tecnologías

- **HTML5** — estructura semántica
- **CSS3** — diseño minimalista con variables CSS y grid layout
- **JavaScript (ES2020, vanilla)** — parsing con `DOMParser`, conversión recursiva y descarga con `Blob` + `URL.createObjectURL`

Sin frameworks. Sin dependencias externas. Funciona completamente en el navegador.

---

## Desarrollador

**Daniel Villa**  
GitHub: [@danielvillam](https://github.com/danielvillam)

---

## Licencia

MIT — libre para usar, modificar y distribuir.
