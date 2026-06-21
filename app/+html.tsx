import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Casa Mineira SaaS</title>
        <meta
          name="description"
          content="Plataforma SaaS para empresas de serviços gerirem clientes, profissionais, pedidos, propostas, financeiro e white-label."
        />
        <meta name="robots" content="index,follow" />
        <meta property="og:title" content="Casa Mineira SaaS" />
        <meta
          property="og:description"
          content="Teste grátis, demo, onboarding automático e operação completa para empresas de serviços."
        />
        <link rel="canonical" href="/" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #020617;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #020617;
  }
}`;
