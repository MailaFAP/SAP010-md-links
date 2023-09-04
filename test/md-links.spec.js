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
  it('retorna um array de objetos contendo o href e o text dos links', () => {
    const texto = 'Este é um exemplo de texto[https://google.com] que contém links.';
    const resultado = extraiLinks(texto);

    expect(resultado).toEqual([
      { href: 'https://google.com', text: 'que contém links' },
    ]);
  });

  it('retorna um array com um objeto de erro caso não haja links no texto', () => {
    const texto = 'Este é um exemplo de texto sem links.';
    const resultado = extraiLinks(texto);

    expect(resultado).toEqual([{ error: 'Este arquivo não contém links.' }]);
  });
});


//passou
describe('trataErro', () => {
  it('deve rejeitar a promessa com a mensagem de erro fornecida', () => {
    const mensagemErro = 'Error message';

    return trataErro(mensagemErro).catch((error) => {
      expect(error).toBe(mensagemErro);
    });
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
  it('deve retornar os links do arquivo se a extensão for permitida', async () => {
    const caminhoDoArquivo = '/caminho/do/arquivo.md'; 
    const caminhoAbsoluto = path.resolve(caminhoDoArquivo); 
    const conteudoDoArquivo = 'Exemplo de link: link';

    const extraiLinks = jest.fn().mockReturnValue([
      {
        href: 'https://exemplo.com',
        text: 'link',
        file: caminhoAbsoluto
      }
    ]);

    path.extname.mockReturnValue('.md');
    path.resolve.mockReturnValue(caminhoAbsoluto);
    readFile.mockResolvedValue(conteudoDoArquivo);

    const resultado = await processarArquivo(caminhoDoArquivo);

    expect(path.extname).toHaveBeenCalledWith(caminhoDoArquivo);
    expect(path.resolve).toHaveBeenCalledWith(caminhoDoArquivo);
    expect(readFile).toHaveBeenCalledWith(caminhoAbsoluto, 'utf-8');
    expect(extraiLinks).toHaveBeenCalledWith(conteudoDoArquivo);
    expect(resultado).toEqual([
      {
        href: 'https://exemplo.com',
        text: 'link',
        file: caminhoAbsoluto
      }
    ]);
  });

  it('deve retornar uma mensagem de erro se a extensão não for permitida', async () => {
    const caminhoDoArquivo = '/caminho/do/arquivo.txt';

    path.extname.mockReturnValue('.txt');

    const resultado = await processarArquivo(caminhoDoArquivo);

    expect(path.extname).toHaveBeenCalledWith(caminhoDoArquivo);
    expect(resultado).toEqual([
      {
        error: 'Este arquivo não contém extensão Markdown'
      }
    ]);
  });
});


describe('lerArquivo', () => {
  it('deve retornar a lista de links obtidos no arquivo', async () => {
    const caminhoDoArquivo = 'caminho/do/arquivo.md';
    const resultado = await lerArquivo(caminhoDoArquivo);
    expect(resultado).toEqual(['dados1', 'dados2', 'dados3']); // Substitua com o valor esperado da lista
  });

  it('deve retornar um erro se o arquivo não existir', async () => {
    const caminhoDoArquivo = 'caminho/do/arquivo-inexistente.txt';
    const resultado = await lerArquivo(caminhoDoArquivo);
    expect(resultado).toBeInstanceOf(Error); // Verifica se o resultado é uma instância de Error
  });
});

describe('lerDiretorio', () => {
  it('deve retornar um array de links quando o diretório contiver arquivos e pastas', async () => {
    // Defina o comportamento esperado do mock fs.readdirSync
    fs.readdirSync.mockReturnValue(['arquivo1.md', 'arquivo2.md', 'pasta1', 'pasta2']);

    // Defina o comportamento esperado do mock fs.statSync
    fs.statSync.mockImplementation((caminho) => {
      if (caminho.endsWith('.md')) {
        return { isDirectory: () => false };
      } else {
        return { isDirectory: () => true };
      }
    });

    // Defina o comportamento esperado do mock processarArquivo
    const processarArquivo = jest.fn().mockResolvedValue('link');

    // Chame a função que você está testando
    const resultado = await lerDiretorio('caminho/do/diretorio', {
      processarArquivo: processarArquivo
    });

    // Verifique se o resultado é o esperado
    expect(resultado).toEqual(['link', 'link', 'link']);

    // Verifique se a função processarArquivo foi chamada corretamente
    expect(processarArquivo).toHaveBeenCalledTimes(3);
    expect(processarArquivo).toHaveBeenCalledWith('caminho/do/diretorio/arquivo1.md');
    expect(processarArquivo).toHaveBeenCalledWith('caminho/do/diretorio/pasta1');
    expect(processarArquivo).toHaveBeenCalledWith('caminho/do/diretorio');
  });
});

describe('mdLinks', () => {
  it('should return the links in a file when the path is a file and options are not defined', () => {
    const path = 'path/to/file.md';
    const result = mdLinks(path);

    return result.then((links) => {
      chai.expect(links).to.deep.equal(['https://example.com']);
    });
  });

  it('should validate the links in a file when the path is a file and options.validate is true', () => {
    const path = 'path/to/file.md';
    const options = {
      validate: true
    };
    const result = mdLinks(path, options);

    return result.then((links) => {
      const expectedLinks = [
        {
          href: 'https://example.com',
          text: 'Example',
          file: 'path/to/file.md',
          status: 200,
          statusText: 'OK'
        }
      ];
      chai.expect(links).to.deep.equal(expectedLinks);
    });
  });

  it('should return the statistics of the links in a file when the path is a file and options.stats is true', () => {
    const path = 'path/to/file.md';
    const options = {
      stats: true
    };
    const result = mdLinks(path, options);

    return result.then((statistics) => {
      const expectedStatistics = {
        total: 1,
        unique: 1
      };
      chai.expect(statistics).to.deep.equal(expectedStatistics);
    });
  });

  it('should return the links in a file when the path is a file and options are not defined', () => {
    const path = 'path/to/file.md';
    const result = mdLinks(path);

    return result.then((links) => {
      chai.expect(links).to.deep.equal(['https://example.com']);
    });
  });

  it('should return an error message when the path is incorrect or does not exist', () => {
    const path = 'incorrect/path';
    const errorMessage = 'Caminho incorreto/inexistente';
    const result = mdLinks(path);

    return result.catch((error) => {
      chai.expect(error.message).to.equal(errorMessage);
    });
  });

  it('should return the links in a directory when the path is a directory and options are not defined', () => {
    const path = 'path/to/directory';
    const result = mdLinks(path);

    return result.then((links) => {
      chai.expect(links).to.deep.equal([
        {
          href: 'https://example.com',
          text: 'Example',
          file: 'path/to/directory/file1.md'
        },
        {
          href: 'https://example2.com',
          text: 'Example 2',
          file: 'path/to/directory/file2.md'
        }
      ]);
    });
  });
});