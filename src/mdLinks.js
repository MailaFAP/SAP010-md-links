import fs from 'fs';
import fsp from 'fs/promises';
import chalk from 'chalk';
import path from 'path';
import axios from 'axios';

//função que extrai os links do arquivo markdown
function extraiLinks(texto) {
  const regex = /\[([^[\]]+)\]\((https?:\/\/[^\s/$.?#].[^\s]*)\)/g;
  const capturas = [...texto.matchAll(regex)];
  const resultado = capturas.map(captura => ({ href: captura[2], text: captura[1] }));
  return resultado.length !== 0 ? resultado : trataErro({ code: 400 }, 'não há links no arquivo');
}

//função que lida com os erros
function trataErro(erro, mensagemErro) {
  throw new Error(chalk.red(erro.code, mensagemErro));
}

function processarArquivo(caminhoDoArquivo) {
  const extensoesPermitidas = ['.md', '.mkd', '.mdwn', '.mdown', '.mdtxt', '.mdtext', '.markdown', '.text'];
  if (extensoesPermitidas.includes(path.extname(caminhoDoArquivo))) {
    const caminhoAbsoluto = path.resolve(caminhoDoArquivo);
    return fsp
      .readFile(caminhoAbsoluto, 'utf-8')
      .then((texto) => {
        let links = extraiLinks(texto);
        links.forEach((link) => {
          link.file = caminhoAbsoluto;
        });
        return links;
      })
      .catch((erroDeLeitura) => {
        return trataErro(erroDeLeitura, 'Houve um problema de leitura');
      });      
  } else {
    return trataErro({ code: 404 }, 'Este arquivo não contém extensão Markdown');
  }
}

function validaLinks(links) {
  const promises = links.map((link) =>
    axios.get(link.href)
      .then((response) => {
        link.status = response.status;
        link.ok = response.status === 200 ? 'OK' : 'FAIL';
        return link;
      })
      .catch(() => {
        link.status = 404;
        link.ok = 'FAIL';
        return link;
      })
  )
  return Promise.all(promises);
}


function mdLinks(caminhoDoArquivo, options) {
  if (fs.statSync(caminhoDoArquivo).isFile()) {
    const lista = processarArquivo(caminhoDoArquivo);
    if (options.validate === true) {
      return lista.then((data) => {
        return validaLinks(data)
        .then((data) => {
          return data;
        })
      })
    } else {
      return processarArquivo(caminhoDoArquivo);
    }

  } else if (fs.stat(caminhoDoArquivo).isDirectory()) {
    const arquivos = fs.readdirSync(caminhoDoArquivo);
    arquivos.forEach((nomeDeArquivo) => {
      return processarArquivo(`${caminhoDoArquivo}/${nomeDeArquivo}`);
    });
  }
}

export default mdLinks;