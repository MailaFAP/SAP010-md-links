import mdLinks from '../src/mdLinks';
import trataErro from '../src/mdLinks';
import chalk from 'chalk';
import fs from 'node:fs';
import axios from 'axios';


describe('extraiLinks', () => {
  it('Extrai links e retorna um href e text com tratamento de erro', () => {
    const texto = 'Olá, https://www.exemplo.com este é um exemplo de link em um texto';
    const resultado = extraiLinks(texto);
    expect(Array.isArray(resultado)).toBe(true);
    expect(resultado[0]).toEqual({ href: 'https://www.exemplo.com', text: 'Exemplo de link' });
  });
  it('Retorna mensagem de erro quando não há links', () => {
    const texto = 'Este texto não contém links';
    const resultado = extraiLinks(texto);
    expect(resultado).toEqual([]);
    expect(resultado).toEqual(trataErro({ code: 400 }, 'não há links no arquivo'));
  });
});


describe('trataErro', () => {
  it('Deve lançar um erro com a mensagem correta', () => {
    const erro = { code: 400 };
    const mensagemErro = 'não há links no arquivo';
  
    expect(() => {
      trataErro(erro, mensagemErro);
    }).toThrowError('400 não há links no arquivo');
  });
});