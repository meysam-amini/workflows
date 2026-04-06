import { Button } from "./Button";



export const CardView=({children}:React.PropsWithChildren)=>{

    return(
        <div className="cardview">
            <p>inside the parent component...</p>
             <Button/> 
            {children}
        </div>);
    
};