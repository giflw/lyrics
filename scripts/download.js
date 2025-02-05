import '../lib/fetch-polyfill.js'
import chalk from 'chalk'
import { parse } from 'node-html-parser';
import path from 'path'
import fs from 'fs'

async function getHtml(url) {
    return await fetch(url)
        .then(response => {
            return response.text()
        })
        .then(text => {
            return parse(text)
        }).catch(error => {
            console.log(chalk.redBright(error))
        })
}

const discografias = [
    {
        name: "HASD - 2022", url: "https://www.letras.mus.br/novo-hinario-adventista/discografia/", n: album => album.split('-')[1].trim().split(' ')[0], fixN: (songs) => {
            let fixNumber = (n) => `${n}`
            for (let i = 0; i < songs.length; i++) {
                let song = songs[i]
                if (song.name == 'Chegou a Hora de Adorar ao Senhor' && typeof (song.number) != 'string') {
                    songs[i + 1] = { number: `${song.number}B`, name: songs[i + 1].name, url: song.url }
                    songs[i] = { number: `${song.number}A`, name: song.name, url: song.url }
                } else if (song.name == 'Chegou a Hora de Adorar ao Senhor' && typeof (song.number) == 'string') {
                    //console.log("change fix number")
                    fixNumber = (n) => `${n - 1}`
                    continue
                }

                song = songs[i]
                songs[i] = { number: fixNumber(song.number), name: song.name, url: song.url }
            }
        }
    },
    { name: "HASD - 2000", url: "https://www.letras.mus.br/hinario-adventista/discografia/", n: album => (album.trim().split(" ")[1] - 1) * 20 }
]

for (const discografia of discografias) {
    console.log(chalk.bgYellowBright(" " + "".padStart(discografia.url.length, "=") + " "))
    console.log(chalk.bgYellowBright(" " + discografia.name.padEnd(discografia.url.length, " ") + " "))
    console.log(chalk.bgYellowBright(" " + discografia.url + " "))
    console.log(chalk.bgYellowBright(" " + "".padStart(discografia.url.length, "=") + " "))


    console.log(chalk.blueBright(`${discografia.name} Download`))

    const html = await getHtml(discografia.url)

    const albums = html.querySelectorAll('.albumItem')

    /**
     * @type array
     */
    let songs = albums.map(album => {
        let n = discografia.n(album.querySelector('.songList-header-name').text)
        const rows = album.querySelectorAll('.songList-table-row')
        return rows.map(row => { return { number: n++, name: row.getAttribute('data-name').trim(), url: row.getAttribute('data-shareurl').trim() } })
    });

    songs = songs.flat().sort((a, b) => a.number - b.number);

    discografia.fixN && discografia.fixN(songs)

    const letrasDir = path.join(import.meta.dirname, '..', 'letras', discografia.name.replaceAll(" ", "_"))

    if (!fs.existsSync(letrasDir)) {
        fs.mkdirSync(letrasDir, { recursive: true })
    }


    for (let song of songs) {
        const title = `${String(song.number).padStart(3, '0')} - ${song.name}`
        console.log(chalk.blueBright(title))

        const letra = (await getHtml(songs[0].url)).querySelectorAll('.lyric-original p').map(p => p.text.trim()).join("\n\n")

        fs.writeFileSync(path.join(letrasDir, title.replaceAll(" ", "_") + '.txt'), title + "\n\n" + letra)
    }
}

console.log(chalk.greenBright("done!"))
