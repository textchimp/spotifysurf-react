
const d = function(heading, css, ...args) {

  if( !('DEBUG' in window) ) return;

  let secondArg = '';
  if (css !== undefined && typeof css === 'string' && css.startsWith('css')){
    css = css.split('css').slice(1);
  } else {
    if( arguments.length > 1 ) {
      secondArg = css;
    }
    css = 'font-size: 16px; color: orange;';
  }

  console.log(`%c${heading}`, css, secondArg, ...args );

};

export { d };
