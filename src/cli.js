#!/usr/bin/env node

import chalk from 'chalk';
import mdLinks from './mdLinks.js';
import fs from 'fs/promises';

const caminho = process.argv;

function imprimeLista(resultado, identificador = '') {
    console.log(chalk.yellow('lista de links', chalk.black.bgGreen(identificador), JSON.stringify(resultado)));
}

//analisa se é arquivo ou diretório, imprime o objeto com o nome da sua respectiva lista de arquivo
function processaTexto(argumentos) {
    try {
        const caminho = argumentos[2];
        if (fs.stat(caminho).isFile()) {
            mdLinks(argumentos[2])
                .then(resultado => imprimeLista(resultado)
                )

        } else if (fs.stat(caminho).isDirectory()) {
            const arquivos = fs.readdirSync(caminho);
            arquivos.forEach((nomeDeArquivo) => {
                mdLinks(`${caminho}/${nomeDeArquivo}`)
                    .then(lista => imprimeLista(lista, nomeDeArquivo)
                    )
            })
        }
    } catch (erro) {
        console.log(erro)
    }

}
processaTexto(caminho);

