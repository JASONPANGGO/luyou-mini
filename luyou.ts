import { readFileSync } from 'fs';
import { createServer, ServerResponse } from 'http';
import { runInContext, createContext, Script } from 'vm';

class Router {
  id: number;
  router: string;
  code: string;
}

const DATA_SOURCE: string = 'db.json';

const typeCheck = (value) => {
  if (typeof value === 'object') return Buffer.from(JSON.stringify(value));
  if (typeof value !== 'string') return Buffer.from(String(value));
  return value;
};

const getAllRouters = (): Router[] => JSON.parse(readFileSync(DATA_SOURCE).toString());

/**
 * VM
 * @param {Router} router
 * @returns
 */
const codeRunner = async (router: Router) => {
  const { code } = router;
  const codeWrapper = (code: string) => `(async ()=> {\n${code}\n})()`;
  const context = createContext(globalThis);
  return await runInContext(codeWrapper(code), context);
};

const NotFound = (res: ServerResponse) => {
  res.setHeader('Content-Type', 'text/html');
  res.statusCode = 404;
  res.end(Buffer.from(readFileSync('./404.html')));
};

const ResponseCodeRunner = async (matchedRouter: Router, res: ServerResponse) => {
  const result = await codeRunner(matchedRouter);
  res.setHeader('Content-Type', 'application/json');
  res.end(typeCheck(result));
};

const getRouter = (url: string): Router => getAllRouters().find(({ router }) => router === url);

/**
 * Server
 */
const app = createServer(({ url }, res) => {
  const matchedRouter: Router = getRouter(url);
  if (matchedRouter) {
    ResponseCodeRunner(matchedRouter, res);
  } else {
    NotFound(res);
  }
}).listen(3000);
