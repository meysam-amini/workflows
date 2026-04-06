export const Greeting=({isLoggedIn})=>{

    return (
        <>
        {isLoggedIn?
        (<h1>Welcome!</h1>)
        :
        (<h1>Please sign in!</h1>)

        }
        
        </>
    );
}