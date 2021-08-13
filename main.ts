import { readFileSync } from 'fs';
import { createServer, ServerResponse } from 'http';
import { runInContext, createContext, Script } from 'vm';

/**
 * VM
 * @param {Router} router
 * @returns
 */
const codeRunner = async (route: Router) => {
  const { code, router } = route;
  const codeWrapper = (code: string) =>
    `(async ()=> {
      ${code}
  })()`;
  const context = createContext(Object.assign(Object.create(null), console));
  return await runInContext(codeWrapper(code), context);
};

class Router {
  id: number;
  router: string;
  code: string;
}

const DATA_SOURCE: string = 'db.json';

const responseTypeCheck = (value) => {
  if (typeof value === 'object') return Buffer.from(JSON.stringify(value));
  if (typeof value !== 'string') return Buffer.from(String(value));
  return value;
};

const getAllRouters = (): Router[] => JSON.parse(readFileSync(DATA_SOURCE).toString());

const NotFound = (res: ServerResponse) => {
  res.setHeader('Content-Type', 'text/html');
  res.statusCode = 404;
  res.end(Buffer.from(readFileSync('./404.html')));
};

const ResponseCodeRunner = async (matchedRouter: Router, res: ServerResponse) => {
  const result = await codeRunner(matchedRouter);
  res.setHeader('Content-Type', 'application/json');
  res.end(responseTypeCheck(result));
};

const getRouter = (url: string): Router => getAllRouters().find(({ router }) => router === url);

/**
 * Server
 */
const PORT = 9527;
const app = createServer(({ url }, res) => {
  const matchedRouter: Router = getRouter(url);
  if (matchedRouter) {
    ResponseCodeRunner(matchedRouter, res);
  } else {
    NotFound(res);
  }
}).listen(PORT);
console.log('Server is listening on port:', PORT);
