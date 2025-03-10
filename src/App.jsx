import Animation from './animation';
import Shapes from './shapes.svg?react';
import { useState, useEffect, useRef } from 'react';

function App() {
  const [animationData, setAnimationData] = useState({});
  const [anim] = useState(new Animation());
  const [filename, setFilename] = useState(null);

  const picker = useRef(null);
  const scriptView = useRef(null);

  function switchAnimation(e){
    let picked = `${e.target.value}.json`;
    setFilename(picked); //trigger statechange
  }
  function showScript(){
    scriptView.current.showModal();
  }
  function closeScript(){
    scriptView.current.close();
  }
  function redoAnimation(){
    anim.Prepare(animationData.animations, animationData.start, 'main','#animation-section');
  }

  useEffect(()=>{
    const abortController = new AbortController();

    console.log('useEffect');
    const loadAnimation = async (jsonfile)=>{
      console.log('loadAnimation!', filename);
      fetch(jsonfile).then(
        async response=>{
          console.log('loadAnimation then!!!!!');
          let data = await response.json();
          console.log(data);
          setAnimationData(data);
          anim.Prepare(data.animations, data.start, 'main','#animation-section');
        }
      );
    }
    if (filename==null){
      let picked = picker.current.value;
      loadAnimation(`${picked}.json`);
    }else{
      loadAnimation(filename);
    }

    return () => abortController.abort();
  },[filename, anim]);

  return (
    <>
      <header>
        <h1>{animationData.name}</h1>
        <fieldset>
          <label htmlFor="picker">Pick an animation</label>
          <select id="picker" ref={picker} onChange={switchAnimation}>
            <option value="basic1">Basic Example 1</option>
            <option value="basic2">Basic Example 2</option>
            <option value="drawing_lines">Drawing Lines</option>
            <option value="pie">Pie Reveal</option>
            <option value="changing_shapes">Changing Shapes</option>
            <option value="scrolling">Scrolling Triggers</option>
          </select>
          <button onClick={showScript}>View Script</button>
          <button onClick={redoAnimation}>&#x27F3;</button>
        </fieldset>
      </header>

      <main>
        <section id="animation-section">
          <h2 id="sub-text">Hello this is an animation!!</h2>
          <div id="images">
            <div id="shapes-holder"><Shapes id="shapes" /></div>
            <div id="face-holder"><img id="face" src="Mr._Smiley_Face.svg" alt="Smiley Face" /></div>
          </div>
          <div id="more-text">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer elit metus, lacinia sed mattis id, aliquet ut nisl. Curabitur sit amet fringilla nulla. Mauris ut interdum augue. Suspendisse potenti. Fusce eget tellus a nisi lobortis rhoncus. In tincidunt malesuada consequat. Sed vel ex dignissim, facilisis arcu et, tempor neque. Duis iaculis felis vitae fermentum condimentum. Sed a enim sem. Donec urna massa, tincidunt in odio in, suscipit suscipit dolor. Praesent scelerisque odio vitae posuere accumsan. In vitae nisl sem.</p>
          </div>
          <div id="boxes">
            <div>1</div>
            <div>2</div>
            <div>3</div>
            <div>4</div>
            <div>5</div>
            <div>6</div>
          </div>
        </section>
      </main>
      <dialog id="animation-script" ref={scriptView}>
        <div>
          <button onClick={closeScript}>Close</button>
          <pre>{JSON.stringify(animationData,null,4)}</pre>
        </div>
      </dialog>
    </>
  );
}

export default App;
