export const complexityLevels = [
  { id: 'beginner', name: { pt: 'Iniciante', en: 'Beginner' } },
  { id: 'intermediate', name: { pt: 'Intermediário', en: 'Intermediate' } },
  { id: 'advanced', name: { pt: 'Avançado', en: 'Advanced' } },
] as const;

type Complexity = (typeof complexityLevels)[number]['id'];
interface Example {
  level: Complexity;
  name: { pt: string; en: string };
  code: { pt: string; en: string };
}

export const examples: Example[] = [
  {
    level: 'beginner',
    name: { pt: 'Primeiro quadrado', en: 'First square' },
    code: {
      en: '; Four sides, one discovery.\nsetpencolor "blue\nsetpensize 3\nrepeat 4 [\n  forward 100\n  right 90\n]',
      pt: '; Quatro lados, uma descoberta.\nmudecorcaneta "azul\nmudeespessura 3\nrepita 4 [\n  parafrente 100\n  paradireita 90\n]',
    },
  },
  {
    level: 'intermediate',
    name: { pt: 'Jardim geométrico', en: 'Geometric garden' },
    code: {
      en: 'setpencolor "green\nrepeat 18 [\n  repeat 4 [forward 85 right 90]\n  right 20\n]',
      pt: 'mudecorcaneta "verde\nrepita 18 [\n  repita 4 [parafrente 85 paradireita 90]\n  paradireita 20\n]',
    },
  },
  {
    level: 'advanced',
    name: { pt: 'Espiral recursiva', en: 'Recursive spiral' },
    code: {
      en: 'to spiral :side\n  if :side > 180 [stop]\n  forward :side\n  right 91\n  spiral :side + 4\nend\nsetpencolor "purple\nspiral 4',
      pt: 'aprenda espiral :lado\n  se :lado > 180 [pare]\n  parafrente :lado\n  paradireita 91\n  espiral :lado + 4\nfim\nmudecorcaneta "roxo\nespiral 4',
    },
  },
  {
    level: 'intermediate',
    name: { pt: 'Conversa no console', en: 'Console conversation' },
    code: {
      en: 'print [What is your name?]\nmake "name readword\nprint sentence [Hello,] :name\nprint [Enter three RGB numbers, e.g. 20 140 100]\nsetpencolor readlist\nrepeat 3 [forward 100 right 120]',
      pt: 'escreva [Qual é o seu nome?]\natribua "nome leiapalavra\nescreva frase [Olá,] :nome\nescreva [Digite três números RGB, por exemplo 20 140 100]\nmudecorcaneta leialista\nrepita 3 [parafrente 100 paradireita 120]',
    },
  },
  {
    level: 'beginner',
    name: { pt: 'Primeiros movimentos', en: 'First movements' },
    code: {
      pt: '; Avance, gire e observe a direção.\nparafrente 80\nparadireita 90\nparafrente 100\nparaesquerda 90\nparafrente 60',
      en: '; Move, turn, and observe the heading.\nforward 80\nright 90\nforward 100\nleft 90\nforward 60',
    },
  },
  {
    level: 'beginner',
    name: { pt: 'Triângulo equilátero', en: 'Equilateral triangle' },
    code: {
      pt: '; O giro é o ângulo externo: 120 graus.\nrepita 3 [\n  parafrente 140\n  paradireita 120\n]',
      en: '; Turn by the exterior angle: 120 degrees.\nrepeat 3 [\n  forward 140\n  right 120\n]',
    },
  },
  {
    level: 'beginner',
    name: { pt: 'Caminho tracejado', en: 'Dashed path' },
    code: {
      pt: '; Levantar a caneta permite andar sem desenhar.\nparadireita 90\nrepita 6 [\n  parafrente 20\n  levantecaneta\n  parafrente 15\n  baixecaneta\n]',
      en: '; Lift the pen to move without drawing.\nright 90\nrepeat 6 [\n  forward 20\n  penup\n  forward 15\n  pendown\n]',
    },
  },
  {
    level: 'beginner',
    name: { pt: 'Estrela de cinco pontas', en: 'Five-pointed star' },
    code: {
      pt: '; Experimente mudar a distância mantendo o giro.\nmudecorcaneta "laranja\nrepita 5 [\n  parafrente 150\n  paradireita 144\n]',
      en: '; Try changing the distance while keeping the turn.\nsetpencolor "orange\nrepeat 5 [\n  forward 150\n  right 144\n]',
    },
  },
  {
    level: 'intermediate',
    name: { pt: 'Quadrados crescentes', en: 'Growing squares' },
    code: {
      pt: '; Uma variável controla o tamanho de cada quadrado.\natribua "lado 30\nrepita 6 [\n  repita 4 [parafrente :lado paradireita 90]\n  atribua "lado :lado + 25\n]',
      en: '; A variable controls the size of each square.\nmake "side 30\nrepeat 6 [\n  repeat 4 [forward :side right 90]\n  make "side :side + 25\n]',
    },
  },
  {
    level: 'intermediate',
    name: { pt: 'Casa com procedimento', en: 'House with a procedure' },
    code: {
      pt: '; Reutilize o procedimento com outro tamanho.\naprenda casa :lado\n  repita 4 [parafrente :lado paradireita 90]\n  parafrente :lado\n  paradireita 30\n  repita 3 [parafrente :lado paradireita 120]\n  paraesquerda 30\nfim\nmudecorcaneta "roxo\ncasa 100',
      en: '; Reuse this procedure with another size.\nto house :side\n  repeat 4 [forward :side right 90]\n  forward :side\n  right 30\n  repeat 3 [forward :side right 120]\n  left 30\nend\nsetpencolor "purple\nhouse 100',
    },
  },
  {
    level: 'intermediate',
    name: { pt: 'Paleta de cores', en: 'Color palette' },
    code: {
      pt: '; Leia cada cor de uma lista usando sua posição.\natribua "cores [red orange green blue purple]\natribua "indice 1\nlevantecaneta\nmudexy -100 -70\nbaixecaneta\nrepita conte :cores [\n  mudecorcaneta elemento :indice :cores\n  mudeespessura 8\n  parafrente 140\n  levantecaneta\n  paratras 140\n  paradireita 90\n  parafrente 40\n  paraesquerda 90\n  baixecaneta\n  atribua "indice :indice + 1\n]',
      en: '; Read each color from a list using its position.\nmake "colors [red orange green blue purple]\nmake "index 1\npenup\nsetxy -100 -70\npendown\nrepeat count :colors [\n  setpencolor item :index :colors\n  setpensize 8\n  forward 140\n  penup\n  back 140\n  right 90\n  forward 40\n  left 90\n  pendown\n  make "index :index + 1\n]',
    },
  },
  {
    level: 'advanced',
    name: { pt: 'Árvore recursiva', en: 'Recursive tree' },
    code: {
      pt: '; Cada ramo cria dois ramos menores e retorna à base.\naprenda arvore :tamanho :nivel\n  se :nivel = 0 [pare]\n  parafrente :tamanho\n  paraesquerda 28\n  arvore :tamanho * 0.7 (:nivel - 1)\n  paradireita 56\n  arvore :tamanho * 0.7 (:nivel - 1)\n  paraesquerda 28\n  paratras :tamanho\nfim\nmudecorcaneta "verde\nlevantecaneta\nparatras 150\nbaixecaneta\narvore 80 5',
      en: '; Each branch creates two smaller branches and returns to its base.\nto tree :size :level\n  if :level = 0 [stop]\n  forward :size\n  left 28\n  tree :size * 0.7 (:level - 1)\n  right 56\n  tree :size * 0.7 (:level - 1)\n  left 28\n  back :size\nend\nsetpencolor "green\npenup\nback 150\npendown\ntree 80 5',
    },
  },
  {
    level: 'advanced',
    name: { pt: 'Floco de Koch', en: 'Koch snowflake' },
    code: {
      pt: '; Cada segmento é substituído por quatro segmentos.\naprenda koch :tamanho :nivel\n  se :nivel = 0 [parafrente :tamanho pare]\n  atribualocal "parte :tamanho / 3\n  koch :parte (:nivel - 1)\n  paraesquerda 60\n  koch :parte (:nivel - 1)\n  paradireita 120\n  koch :parte (:nivel - 1)\n  paraesquerda 60\n  koch :parte (:nivel - 1)\nfim\nlevantecaneta\nmudexy -110 70\nmudedirecao 90\nbaixecaneta\nrepita 3 [koch 220 3 paradireita 120]',
      en: '; Replace each segment with four smaller segments.\nto koch :size :level\n  if :level = 0 [forward :size stop]\n  localmake "part :size / 3\n  koch :part (:level - 1)\n  left 60\n  koch :part (:level - 1)\n  right 120\n  koch :part (:level - 1)\n  left 60\n  koch :part (:level - 1)\nend\npenup\nsetxy -110 70\nsetheading 90\npendown\nrepeat 3 [koch 220 3 right 120]',
    },
  },
  {
    level: 'advanced',
    name: { pt: 'Quadrados recursivos', en: 'Recursive squares' },
    code: {
      pt: '; A condição de parada limita a recursão.\naprenda encaixe :lado :nivel\n  se :nivel = 0 [pare]\n  repita 4 [parafrente :lado paradireita 90]\n  paradireita 15\n  encaixe :lado * 0.78 (:nivel - 1)\nfim\nmudecorcaneta "roxo\nencaixe 150 9',
      en: '; The base case bounds the recursion.\nto nested :side :level\n  if :level = 0 [stop]\n  repeat 4 [forward :side right 90]\n  right 15\n  nested :side * 0.78 (:level - 1)\nend\nsetpencolor "purple\nnested 150 9',
    },
  },
  {
    level: 'advanced',
    name: { pt: 'Polígonos com retorno', en: 'Polygons with return values' },
    code: {
      pt: '; Um procedimento calcula; outro usa seu resultado.\naprenda angulo :lados\n  retorne 360 / :lados\nfim\naprenda poligono :lados :tamanho\n  repita :lados [\n    parafrente :tamanho\n    paradireita angulo :lados\n  ]\nfim\natribua "formas [3 5 8]\natribua "indice 1\nrepita conte :formas [\n  poligono elemento :indice :formas 65\n  atribua "indice :indice + 1\n]',
      en: '; One procedure calculates; another uses its result.\nto angle :sides\n  output 360 / :sides\nend\nto polygon :sides :size\n  repeat :sides [\n    forward :size\n    right angle :sides\n  ]\nend\nmake "shapes [3 5 8]\nmake "index 1\nrepeat count :shapes [\n  polygon item :index :shapes 65\n  make "index :index + 1\n]',
    },
  },
];
