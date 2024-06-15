import Animation from './animation';
import { ReactComponent as Shapes } from './shapes.svg';
import { useState, useEffect } from 'react';

function App() {
  const [animationData, setAnimationData] = useState({});
  const [anim] = useState(new Animation());
  const [filename, setFilename] = useState(null);

  function switchAnimation(e){
    let picked = `${e.target.value}.json`;
    setFilename(picked); //trigger statechange
  }
  function showScript(){
    let dialog = document.getElementById('animation-script');
    dialog.showModal();
  }
  function closeScript(){
    let dialog = document.getElementById('animation-script');
    dialog.close();
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
      let picker = document.querySelector('#picker').value;
      loadAnimation(`${picker}.json`);
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
          <select id="picker" onChange={switchAnimation}>
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
          <Shapes id="shapes" />
          <img id="face" src="Mr._Smiley_Face.svg" alt="Smiley Face" />
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
      <dialog id="animation-script">
        <div>
          <button onClick={closeScript}>Close</button>
          <pre>{JSON.stringify(animationData,null,4)}</pre>
        </div>
      </dialog>
    </>
  );
}

export default App;
