import { readFileSync } from "fs";
import { createServer } from "http";
import { runInContext, createContext, Script } from "vm";

interface Router {
  id: number;
  router: string;
  code: string;
}

const typeCheck = (value) => {
  if (typeof value === "object") return Buffer.from(JSON.stringify(value));
  if (typeof value !== "string") return Buffer.from(String(value));
  return value;
};

const getAllRouters = (): Router[] =>
  JSON.parse(readFileSync("db.json").toString());

/**
 * VM
 * @param router
 * @returns
 */
const codeRunner = async (router: Router) => {
  const { code } = router;
  const codeWrapper = (code: string) => `(async ()=> {\n${code}\n})()`;
  const script = new Script(codeWrapper(code))
  // const context = createContext(globalThis);
  // return await runInContext(codeWrapper(code), context);
  return await script.runInThisContext()
};

const NotFound = (res) => {
  res.setHeader("Content-Type", "text/html");
  res.statusCode = 404;
  res.end(Buffer.from(readFileSync("./404.html")));
};

const ResponseCodeRunner = async (matchedRouter: Router, res) => {
  const result = await codeRunner(matchedRouter);
  res.setHeader("Content-Type", "application/json");
  res.end(typeCheck(result));
};

const getRouter = (url): Router =>
  getAllRouters().find(({ router }) => router === url);

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
