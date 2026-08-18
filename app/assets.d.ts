// Metro, require() ile gelen resim dosyalarini number (asset id) olarak cozer.
// TS bunu bilmiyor, bu yuzden burada elle bildiriliyor.
declare module '*.png' {
  const value: number;
  export default value;
}
