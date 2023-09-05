import { mdLinks, extraiLinks, validaLinks, processarArquivo, lerArquivo, lerDiretorio, statsLinks } from '../src/mdLinks';
import axios from 'axios';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { readFile } from 'fs/promises';

jest.mock('axios');
jest.mock('fs/promises');


//falhou o primeiro teste
describe('extraiLinks', () => {
  it('deve retornar um array de objetos contendo href e text', () => {
    const texto = 'Este é um [exemplo de link] (https://www.exemplo.com)';
    const resultado = extraiLinks(texto);
    expect(resultado).toEqual([{ href: 'https://www.exemplo.com', text: 'exemplo de link' }]);
  });

  it('deve retornar um array vazio quando o texto não contém links', () => {
    const texto = 'Este texto não contém nenhum link';
    const resultado = extraiLinks(texto);
    expect(resultado).toEqual([{ error: 'Este arquivo não contém links.' }]);
  });

  it('deve retornar um array vazio para um texto vazio', () => {
    const texto = '';
    const resultado = extraiLinks(texto);
    expect(resultado).toEqual([{ error: 'Este arquivo não contém links.' }]);
  });
});


//passou
describe('validaLinks', () => {
  it('deve retornar os links válidos com status 200', async () => {
    const links = [
      { href: 'http://www.google.com' },
      { href: 'http://www.facebook.com' },
    ];

    // Mock da resposta do axios para simular uma requisição bem-sucedida
    axios.get.mockImplementation((url) => {
      if (url === 'http://www.google.com') {
        return Promise.resolve({ status: 200 });
      } else if (url === 'http://www.facebook.com') {
        return Promise.resolve({ status: 200 });
      }
    });

    const result = await validaLinks(links);

    expect(result).toEqual([
      { href: 'http://www.google.com', status: 200, ok: 'OK' },
      { href: 'http://www.facebook.com', status: 200, ok: 'OK' },
    ]);
  });

  it('deve retornar os links inválidos com status 404', async () => {
    const links = [
      { href: 'http://www.github.com' },
      { href: 'http://www.nonexistent.com' },
    ];

    // Mock da resposta do axios para simular uma requisição com erro 404
    axios.get.mockImplementation((url) => {
      return Promise.reject(new Error('Request failed with status 404'));
    });

    const result = await validaLinks(links);

    expect(result).toEqual([
      { href: 'http://www.github.com', status: 404, ok: 'FAIL' },
      { href: 'http://www.nonexistent.com', status: 404, ok: 'FAIL' },
    ]);
  });
});

//falhou o primeiro
describe('processarArquivo', () => {
  it('deve retornar os links do arquivo se a extensão for permitida', () => {
    const caminhoDoArquivo = './arquivo.md';

    const resultado = processarArquivo(caminhoDoArquivo);

    expect(resultado).toEqual([
      { href: 'https://www.google.com', text: 'Google', file: '/caminho/absoluto/arquivo.md' },
      { href: 'https://www.facebook.com', text: 'Facebook', file: '/caminho/absoluto/arquivo.md' },
    ]);
  });

  it('deve retornar uma mensagem de erro se a extensão não for permitida', () => {
    const caminhoDoArquivo = './arquivo.txt';

    const resultado = processarArquivo(caminhoDoArquivo);

    expect(resultado).toEqual([{ error: 'Este arquivo não contém extensão Markdown' }]);
  });
});

//passou
describe('statsLinks', () => {
  test('Deve retornar estatísticas corretas para uma lista de links', () => {
    const links = [
      { href: 'https://www.google.com', ok: 'OK' },
      { href: 'https://www.example.com', ok: 'OK' },
      { href: 'https://www.google.com', ok: 'OK' },
      { href: 'https://www.example.com', ok: 'FAIL' },
    ];

    const result = statsLinks(links);

    expect(result.total).toBe(4);
    expect(result.unique).toBe(2);
    expect(result.broken).toBe(1);
  });
});

//
describe('Teste da função lerArquivo', () => {
  it('deve ler e processar o arquivo corretamente', async () => {
    const caminhoDoArquivo = './arquivo.md';

    const resultado = await lerArquivo(caminhoDoArquivo);

    expect(resultado).toEqual(['linha 1', 'linha 2', 'linha 3']);
  });

  it('deve retornar um erro caso ocorra algum problema na leitura do arquivo', async () => {
    const caminhoDoArquivo = 'caminho/inexistente.txt';

    const resultado = await lerArquivo(caminhoDoArquivo);

    expect(resultado).toBeInstanceOf(Error);
  });
});

describe('lerDiretorio', () => {
  it('deve ler o diretório e retornar os links dos arquivos', () => {
    // Definir um diretório de teste
    const caminhoDoDiretorio = './test-directory';

    // Criar um diretório fictício com alguns arquivos
    fs.mkdirSync(caminhoDoDiretorio);
    fs.writeFileSync(`${caminhoDoDiretorio}/arquivo1.txt`, 'Conteúdo do arquivo 1');
    fs.writeFileSync(`${caminhoDoDiretorio}/arquivo2.txt`, 'Conteúdo do arquivo 2');

    // Chamar a função lerDiretorio()
    return lerDiretorio(caminhoDoDiretorio)
      .then((linksArray) => {
        // Verificar se os links retornados são os esperados
        expect(linksArray).toEqual([
          'link para o arquivo1.txt',
          'link para o arquivo2.txt',
        ]);

        // Remover o diretório fictício
        fs.unlinkSync(`${caminhoDoDiretorio}/arquivo1.txt`);
        fs.unlinkSync(`${caminhoDoDiretorio}/arquivo2.txt`);
        fs.rmdirSync(caminhoDoDiretorio);
      });
  });
});

