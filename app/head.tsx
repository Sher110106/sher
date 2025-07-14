export default function Head() {
  return (
    <>
      <title>Quad</title>
      <meta name="description" content="The intersection of teachers and schools" />
      {/* Google tag (gtag.js) */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-XYGMYVJ43M"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XYGMYVJ43M');
          `,
        }}
      />
    </>
  );
} 