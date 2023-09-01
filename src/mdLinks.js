import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import axios from 'axios';

//função que extrai os links do arquivo markdown
export function extraiLinks(texto) {
  const regex = /\[([^[\]]+)\]\((https?:\/\/[^\s/$.?#].[^\s]*)\)/g;
  const capturas = [...texto.matchAll(regex)];
  const resultado = capturas.map(captura => ({ href: captura[2], text: captura[1] }));
  return resultado.length !== 0 ? resultado : [{ erro: 'Este arquivo não contém links.' }];

}

//função que lida com os erros
export function trataErro(mensagemErro) {
  return Promise.reject(mensagemErro);
}


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
      })
  } else {
    return trataErro('Este arquivo não contém extensão Markdown');
  }
}

//função que valida os links encontrados e retorna uma promessa
export function validaLinks(links) {
  const promises = links.map((link) => {
    if (link.erro === undefined) {
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
    } else {
      return link;
    }
  });
  return Promise.all(promises);
}

//função que analisa se é arquivo ou diretório, se é markdown, se tem link, valida os links. Se é diretório, 
//lê e analisa se está com 
function mdLinks(caminhoDoArquivo, options) {
  try {
    if (fs.statSync(caminhoDoArquivo).isFile()) {
      return processarArquivo(caminhoDoArquivo)
              .then(lista =>{
                if (options.stats){
                  return statsLinks(lista)
                } 
                return lista; 

              } )
              .catch(error => error) 

    } else if (fs.statSync(caminhoDoArquivo).isDirectory()) {
      let promises = [];
      const arquivos = fs.readdirSync(caminhoDoArquivo);
      arquivos.forEach((nomeDeArquivo) => {
        if (fs.statSync(`${caminhoDoArquivo}/${nomeDeArquivo}`).isDirectory()) {
          promises.push(mdLinks(`${caminhoDoArquivo}/${nomeDeArquivo}`, options));
        } else {
          promises.push(processarArquivo(`${caminhoDoArquivo}/${nomeDeArquivo}`));
        }
      });
      return Promise.all(promises)
        .then((results) => {
          const linksArray = results.reduce(
            (accumulator, links) => accumulator.concat(links),
            [],
          );
          return linksArray;
        });
    }
  } catch {
    return trataErro('Caminho incorreto/inexistente');
  }
}

 function statsLinks(links){
  const listaLinks = links.length;
  const uniqueLinks = [... new Set(links.map((link) => link.href))].length;
  const brokenLinks = links.filter((link) => link.ok === 'FAIL').length;
  return {
    total: listaLinks,
    unique: uniqueLinks,
    broken: brokenLinks,
  };
}

export default mdLinks;