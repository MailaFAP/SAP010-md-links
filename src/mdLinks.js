import fs from 'node:fs';
import chalk from 'chalk';

function extraiLinks(texto) {
  const regex = /\[([^[\]]+)\]\((https?:\/\/[^\s/$.?#].[^\s]*)\)/g;
  const capturas = [...texto.matchAll(regex)];
  // console.log(capturas);
  const resultado = capturas.map(captura => ({text: captura[1], link: captura[2]}));
  return resultado.length !== 0 ? resultado : 'não há links no arquivo';
}

function trataErro(erro) {
  throw new Error(chalk.red(erro.code, 'não há arquivo no diretório'));
}

function mdLinks(caminhoDoArquivo) {
  const encoding = 'utf-8';
  fs.promises
    .readFile(caminhoDoArquivo, encoding)
    .then((texto) => console.log(extraiLinks(texto)))
    .catch(trataErro)
}

mdLinks('/Users/Maila Ferreira/Desktop/SAP010-md-links/README.md');