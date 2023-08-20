import fs from 'fs/promises';
import chalk from 'chalk';
import path from 'path';

//função que extrai os links do texto
function extraiLinks(texto) {
  const regex = /\[([^[\]]+)\]\((https?:\/\/[^\s/$.?#].[^\s]*)\)/g;
  const capturas = [...texto.matchAll(regex)];
  const resultado = capturas.map(captura => ({ href: captura[2], text: captura[1] }));
  return resultado.length !== 0 ? resultado : trataErro({ code: 400 }, 'não há links no arquivo');
}

//função que lida com os erros
function trataErro(erro, mensagemErro) {
  console.log(erro);
  return new Error(chalk.red(erro.code, mensagemErro));
}

//função que lê o arquivo e extrai os links
function mdLinks(caminhoDoArquivo) {
  if (caminhoDoArquivo.endsWith('.md') ||
    caminhoDoArquivo.endsWith('.mkd') ||
    caminhoDoArquivo.endsWith('.mdwn') ||
    caminhoDoArquivo.endsWith('.mdown') ||
    caminhoDoArquivo.endsWith('.mdtxt') ||
    caminhoDoArquivo.endsWith('.mdtext') ||
    caminhoDoArquivo.endsWith('.markdown') ||
    caminhoDoArquivo.endsWith('.text')) {
    fs
      .readFile(caminhoDoArquivo, 'utf-8')
      .then((texto) => {
        let propriedade = extraiLinks(texto);
        propriedade.forEach((item) => {          
          item.file = caminhoDoArquivo;
        });       
        console.log(JSON.stringify(propriedade)); 
        return propriedade;
      })
      .catch((erroDeLeitura) => console.log(trataErro(erroDeLeitura, 'Houve um problema de leitura')));
  } else {
    const erroDeExtensao = { code: 404 };
    return trataErro(erroDeExtensao, 'Este arquivo não contém extensão Markdown');
  }
}

mdLinks(path.resolve('README.md'));