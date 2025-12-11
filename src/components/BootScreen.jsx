import React from 'react'
import { t } from 'i18next'

function BootScreen({ version, isVisible }) {

    if (!isVisible) return null

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
                <span className="boot-text">&gt; LOADER {version.toUpperCase()}</span>
                <span className="boot-text">&gt; {t('bootWelcome')}</span>
            </pre>
        </div>
    )
}

export default BootScreen