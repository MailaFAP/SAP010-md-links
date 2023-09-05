import { mdLinks, trataErro, extraiLinks, validaLinks, processarArquivo, lerArquivo, lerDiretorio } from '../src/mdLinks';
import axios from 'axios';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { readFile } from 'fs/promises';

jest.mock('axios');
jest.mock('fs/promises');


//falou o primeiro teste
describe('extraiLinks', () => {
  it('deve retornar um array de objetos contendo href e text', () => { 
    const texto = 'Este é um exemplo de link'; 
    const resultado = extraiLinks(texto); 
    expect(resultado).toEqual([{ href: 'https://www.exemplo.com', text: 'exemplo de link' }]); });

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


//falhou por conta de estar lendo undefined em status e ok.
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

//falhou inteiro
describe('processarArquivo', () => {
  it('deve retornar o texto do arquivo se a extensão for permitida', async () => {
    const caminhoDoArquivo = 'caminho/do/arquivo.md';

    const resultado = await processarArquivo(caminhoDoArquivo);

    expect(resultado).toEqual('Conteúdo do arquivo');
  });

  it('deve retornar um array com um objeto de erro se a extensão não for permitida', async () => {
    const caminhoDoArquivo = 'caminho/do/arquivo.md';

    const resultado = await processarArquivo(caminhoDoArquivo);

    expect(resultado).toEqual([{ error: 'Este arquivo não contém extensão Markdown' }]);
  });
});

describe('lerArquivo', () => {
  test('Deve retornar a lista de dados quando o arquivo for processado com sucesso', async () => {
    // Chamar a função e aguardar a resolução da Promise
    const resultado = await lerArquivo('caminho/do/arquivo.md');

    // Verificar se o resultado é o esperado
    expect(resultado).toEqual(expect.any(Array));
    expect(resultado).toHaveLength(5); // Exemplo de tamanho esperado da lista
  });

  test('Deve retornar um erro ao ocorrer um problema na leitura do arquivo', async () => {
    // Chamar a função e aguardar a resolução da Promise
    const resultado = await lerArquivo('caminho/inexistente.md');

    // Verificar se o resultado é o esperado
    expect(resultado).toBeInstanceOf(Error);
    expect(resultado.message).toBe('Arquivo não encontrado'); // Exemplo de mensagem de erro esperada
  });
});

describe('lerDiretorio', () => {

  it('deve retornar uma Promise vazia quando o diretório não existe', async () => {
    fs.readdirSync.mockImplementation(() => {
      throw new Error('Diretório não encontrado');
    });

    const result = await lerDiretorio('/caminho/invalido');

    expect(result).toEqual([]);
  });

  it('deve retornar uma Promise vazia quando o diretório não contem arquivos', async () => {
    const result = await lerDiretorio('/caminho/vazio');

    expect(result).toEqual([]);
  });

  it('deve retornar uma Promise com os arquivos processados corretamente', async () => {
    // Mock para o processarArquivo
    const processarArquivo = jest.fn(() => Promise.resolve('resultado'));

    // Mock para o fs.readdirSync
    fs.readdirSync.mockImplementation(() => ['arquivo1.txt', 'arquivo2.txt']);

    const result = await lerDiretorio('/caminho/valido', { processarArquivo });

    expect(result).toEqual(['resultado', 'resultado']);
    expect(processarArquivo).toHaveBeenCalledTimes(2);
    expect(processarArquivo).toHaveBeenCalledWith('/caminho/valido/arquivo1.txt');
    expect(processarArquivo).toHaveBeenCalledWith('/caminho/valido/arquivo2.txt');
  });

});

describe('mdLinks', () => {
  test('deve retornar uma lista de links quando o caminho do arquivo for válido', () => {
    const caminhoDoArquivo = './caminho/do/arquivo.md';
    const options = {
      validate: false,
      stats: false
    };

    return mdLinks(caminhoDoArquivo, options)
      .then((links) => {
        // Faça asserções aqui para verificar se a lista de links retornada é válida
      });
  });

  test('deve retornar uma lista de links validados quando a opção "validate" for true', () => {
    const caminhoDoArquivo = './caminho/do/arquivo.md';
    const options = {
      validate: true,
      stats: false
    };

    return mdLinks(caminhoDoArquivo, options)
      .then((links) => {
        // Faça asserções aqui para verificar se a lista de links validados retornada é válida
      });
  });

  test('deve retornar um objeto de estatísticas quando a opção "stats" for true', () => {
    const caminhoDoArquivo = './caminho/do/arquivo.md';
    const options = {
      validate: false,
      stats: true
    };

    return mdLinks(caminhoDoArquivo, options)
      .then((stats) => {
        // Faça asserções aqui para verificar se o objeto de estatísticas retornada é válido
      });
  });

  test('deve lançar um erro quando o caminho do arquivo for incorreto ou inexistente', () => {
    const caminhoDoArquivo = './caminho/do/arquivo_inexistente.md';
    const options = {
      validate: false,
      stats: false
    };

    return expect(mdLinks(caminhoDoArquivo, options)).rejects.toEqual('Caminho incorreto/inexistente');
  });
});