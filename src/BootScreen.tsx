export default function BootScreen() {

    return (
        <div id="loader">
            <pre>
                <span className="turn-on-animation">
{`██████╗ ██╗██████╗       ██████╗  █████╗██╗   ██╗
██╔══██╗██║██╔══██╗      ██╔══██╗██╔══██╬██╗ ██╔╝
██████╔╝██║██████╔╝█████╗██████╔╝██║  ██║╚████╔╝
██╔═══╝ ██║██╔═══╝ ╚════╝██╔══██╗██║  ██║ ╚██╔╝
██║     ██║██║           ██████╔╝╚█████╔╝  ██║
╚═╝     ╚═╝╚═╝           ╚═════╝  ╚════╝   ╚═╝

      ██████╗  ██████╗  ██████╗  ██████╗
      ╚════██╗██╔═████╗██╔═████╗██╔═████╗
       █████╔╝██║██╔██║██║██╔██║██║██╔██║
       ╚═══██╗████╔╝██║████╔╝██║████╔╝██║
      ██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝
      ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝`}
                </span>
                <span className="boot-text">&gt; ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL</span>
                <span className="boot-text">&gt; COPYRIGHT 2075-2077 ROBCO INDUSTRIES</span>
                <span className="boot-text">&gt; LOADER {__APP_VERSION__}</span>
                <span className="boot-text">&gt; WELCOME, OVERSEER</span>
            </pre>
        </div>
    )
}
