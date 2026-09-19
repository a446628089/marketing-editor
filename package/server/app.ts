import fs from 'fs';
import path from 'path';
import Koa from 'koa';
import koaBody from 'koa-body';
import Router from 'koa-router';
import koaStatic from 'koa-static';
import { config } from './config';
import { PORT } from './constants';

const app = new Koa();
const schemaFilePath = path.join(__dirname, './data/editor-schema.json');

app.use(koaBody());

const router = new Router();

router.get('/api', async (ctx, next) => {
  ctx.body = { message: 'Hello World' };
  await next();
});

router.get('/api/schema', async (ctx, next) => {
  if (!fs.existsSync(schemaFilePath)) {
    ctx.body = { schema: null };
    await next();
    return;
  }

  const content = fs.readFileSync(schemaFilePath, 'utf-8');
  ctx.body = { schema: JSON.parse(content) };
  await next();
});

router.post('/api/schema', async (ctx, next) => {
  fs.mkdirSync(path.dirname(schemaFilePath), { recursive: true });
  fs.writeFileSync(schemaFilePath, JSON.stringify(ctx.request.body, null, 2), 'utf-8');
  ctx.body = { message: 'Schema saved successfully' };
  await next();
});

router.post('/api', async (ctx, next) => {
  ctx.body = { message: 'Save data successful', receivedData: ctx.request.body };
  await next();
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use(koaStatic(config.staticFilePath));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
