import fs from 'fs/promises';
import chalk from 'chalk';
import path from 'path';

//função que extrai os links do arquivo markdown
function extraiLinks(texto) {
  const regex = /\[([^[\]]+)\]\((https?:\/\/[^\s/$.?#].[^\s]*)\)/g;
  const capturas = [...texto.matchAll(regex)];
  const resultado = capturas.map(captura => ({ href: captura[2], text: captura[1] }));
  return resultado.length !== 0 ? resultado : trataErro({ code: 400 }, 'não há links no arquivo');
}

//função que lida com os erros
function trataErro(erro, mensagemErro) {
  console.log(erro);
  throw new Error(chalk.red(erro.code, mensagemErro));
}

//função que analisa a extensão, se for markdown ele lê o arquivo e extrai os links e adiciona a propriedade 
//file no objeto, se não for markdown, ele retorna uma msg de erro
function mdLinks(caminhoDoArquivo) {
  const extensoesPermitidas = ['.md', '.mkd', '.mdwn', '.mdown', '.mdtxt', '.mdtext', '.markdown', '.text'];
  if (extensoesPermitidas.includes(path.extname(caminhoDoArquivo))) {
    const caminhoAbsoluto = path.resolve(caminhoDoArquivo);
    fs
      .readFile(caminhoAbsoluto, 'utf-8')
      .then((texto) => {
        let propriedade = extraiLinks(texto);
        propriedade.forEach((item) => {
          item.file = caminhoAbsoluto;
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

export default mdLinks//('README.md');