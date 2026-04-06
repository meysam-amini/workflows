export const Button=()=>{

    function handleClick(event){
        alert("test");
        console.log('event',event);
        console.log('event target:',event.target);
        console.log('event type:',event.type);
    };

    return <button onClick={handleClick}>click me</button>;

};