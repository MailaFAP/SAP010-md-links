import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import axios from 'axios';

//função que extrai os links do arquivo markdown
export function extraiLinks(texto) {
  const regex = /\[([^[\]]+)\]\((https?:\/\/[^\s/$.?#].[^\s]*)\)/g;
  const capturas = [...texto.matchAll(regex)];
  const resultado = capturas.map(captura => ({ href: captura[2], text: captura[1] }));
  return resultado.length !== 0 ? resultado : [{ error: 'Este arquivo não contém links.' }];

}

//função que lida com os erros
export function trataErro(mensagemErro) {
  return Promise.reject(mensagemErro);
}

//função que analisa se é markdown, informa o caminho absoluto, lê o arquivo e extrai links 
export function processarArquivo(caminhoDoArquivo) {
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
      }).catch(error => error);
  } else {
    return [{ error: 'Este arquivo não contém extensão Markdown' }];
  }
}

//função que valida os links encontrados e retorna uma promessa
export function validaLinks(links) {
  const promises = links.map((link) => {
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
      });
  });
  return Promise.all(promises);
}

export function statsLinks(links) {
  const listaLinks = links.length;
  //colocar dentro do map e filter um if para não contabilizar link.error
  const uniqueLinks = [... new Set(links.map((link) => link.href))].length;
  const brokenLinks = links.filter((link) => link.ok === 'FAIL').length;
  return {
    total: listaLinks,
    unique: uniqueLinks,
    broken: brokenLinks,
  };
}


function lerArquivo(caminhoDoArquivo) {
  return processarArquivo(caminhoDoArquivo)
    .then(lista => {
      return lista;
    })
    .catch(error => error);
}

function lerDiretorio(caminhoDoDiretorio, options) {
  let promises = [];
  const arquivos = fs.readdirSync(caminhoDoDiretorio);
  arquivos.forEach((nomeDeArquivo) => {
    if (fs.statSync(`${caminhoDoDiretorio}/${nomeDeArquivo}`).isDirectory()) {
      promises.push(lerDiretorio(`${caminhoDoDiretorio}/${nomeDeArquivo}`, options));
    } else {
      promises.push(processarArquivo(`${caminhoDoDiretorio}/${nomeDeArquivo}`));
    }
  });
  return Promise.allSettled(promises)
    .then((results) => {
      const linksArray = results.reduce(
        (accumulator, result) => {
          if (result.status === 'fulfilled') {
            return accumulator.concat(result.value);
          } else {
            console.error(result.reason);
            return accumulator;
          }
        },
        [],
      );
      return linksArray;
    });
}


function mdLinks(caminhoDoArquivo, options) {
  try {
    if (fs.statSync(caminhoDoArquivo).isFile()) {
      return lerArquivo(caminhoDoArquivo, options)
        .then((links) => {
          if (links.length > 0 && links[0].error === undefined) {
            if (options.validate) {
              return validaLinks(links);
            } else if (options.stats) {
              return statsLinks(links);
            } else {
              return links;
            }
          } else {
            return links;
          }
        });
    } else if (fs.statSync(caminhoDoArquivo).isDirectory()) {
      return lerDiretorio(caminhoDoArquivo, options);
    }
  } catch (e) {
    return trataErro('Caminho incorreto/inexistente');
  }
}

export default mdLinks;