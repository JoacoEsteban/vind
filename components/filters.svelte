<div style="display: none">
  <svg>
    <filter id="wavy">
      <feTurbulence
        id="turbulence"
        type="turbulence"
        numOctaves="1"
        result="NOISE">
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="NOISE" scale="50">
      </feDisplacementMap>
      <animate
        xlink:href="#turbulence"
        attributeName="baseFrequency"
        dur="60s"
        keyTimes="0;0.5;1"
        values="0.01 0.02;0.02 0.04;0.01 0.02"
        repeatCount="indefinite">
      </animate>
    </filter>

    <filter id="aberration">
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0">
      </feColorMatrix>
      <feOffset dx="-10" dy="0" result="r"> </feOffset>
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
        result="g">
      </feColorMatrix>
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0">
      </feColorMatrix>
      <feOffset dx="10" dy="0" result="b"> </feOffset>
      <feBlend in="r" in2="g" result="rg" mode="screen"> </feBlend>
      <feBlend in="rg" in2="b" mode="screen"> </feBlend>
    </filter>
  </svg>
</div>
