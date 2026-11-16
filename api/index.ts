import express from 'express';
import serverApp from '../server/index';

void express;

const app: any = (serverApp as any)?.default || serverApp;
app.default = app;
if (typeof module !== 'undefined') {
  module.exports = app;
}
export default app;
