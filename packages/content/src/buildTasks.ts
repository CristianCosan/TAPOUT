// rc.4 (Sir: "study all the exact steps it takes irl... it makes each build more personal"). Every
// build step is a few small jobs, each one click with a hands motion. Somewhere in each step Dan
// says something about it, picked from three or four versions so a second run sounds different.
// Presentation only: the step costs what it costs, all at once, when the last job is done.

export interface BuildTask {
  /** The small jobs, in order. The last one finishes the step. */
  jobs: readonly string[];
  /** What Dan might say while doing it; one is picked per step. */
  say: readonly string[];
  /** The hands motion for each click. */
  motion: 'build' | 'dig' | 'gather' | 'rocks' | 'knife' | 'chop' | 'stir' | 'fire';
}

export const BUILD_TASKS: Readonly<Record<string, BuildTask>> = {
  // Shelter route, ten steps.
  'shelter.1': {
    motion: 'build',
    jobs: ['Pick two trees the right distance apart', 'Cut a straight ridge pole', 'Lift it into the forks', 'Lash both ends tight'],
    say: ['Two trees, one pole. That is a house, if you squint.', 'Square lashing. Dad made me tie it twenty times on the porch.', 'It holds. Okay. It holds.', 'Start small. You only have to get through tonight.'],
  },
  'shelter.2': {
    motion: 'build',
    jobs: ['Cut a dozen poles', 'Lean them against the ridge', 'Cut armloads of spruce boughs', 'Thatch from the bottom up'],
    say: ['Bottom up, so the rain runs off. Not the other way.', 'Every bough is one less drip on my face.', 'It looks like a real lean-to. Mara would laugh. Then she would crawl in.', 'Shingle it like a roof. Overlap, overlap.'],
  },
  'shelter.3': {
    motion: 'build',
    jobs: ['Cut two pairs of heavy poles', 'Notch them where they cross', 'Raise both A-frames', 'Set the ridge across'],
    say: ['An A-frame. Now it is a building.', 'Heavier than it looks. My back says so.', 'If this falls on me in the night, that is the show.', 'Notch, fit, lash. Notch, fit, lash.'],
  },
  'shelter.4': {
    motion: 'build',
    jobs: ['Cut five straight spruce poles', 'Notch them to sit against the ridge', 'Lash each pole at the top', 'Weave thin branches through, low to high'],
    say: ['Tight. Tighter than the last one. Dad would check this knot twice.', 'Walls. Actual walls.', 'Every gap I leave now is wind I feel later.', 'One more pole. Then one more.'],
  },
  'shelter.5': {
    motion: 'gather',
    jobs: ['Cut boughs, thick ones', 'Lay the first row along the bottom', 'Overlap each row above it', 'Weigh the top down with poles'],
    say: ['Thick enough that I cannot see daylight through it.', 'The first night it rains and stays dry in here, I will cry a bit.', 'Boughs smell like Christmas. I should not think about Christmas.', 'Overlap. The water has to go somewhere that is not me.'],
  },
  'shelter.6': {
    motion: 'chop',
    jobs: ['Level the ground for the base', 'Lay the two longest logs', 'Notch the corners', 'Drop the cross logs in'],
    say: ['If the base is not square, nothing above it will be.', 'Saddle notches. Slow. Do them right.', 'This is where a cabin starts. With the dull part.', 'Level. Not perfect. Level.'],
  },
  'shelter.7': {
    motion: 'chop',
    jobs: ['Roll a log up onto the wall', 'Mark where it sits', 'Cut the notch', 'Settle it and check the fit'],
    say: ['Waist high. I can lean on it.', 'Roll, mark, cut, drop. All day.', 'My hands have stopped hurting. That is probably bad.', 'Dad built a shed like this. I held the tape.'],
  },
  'shelter.8': {
    motion: 'chop',
    jobs: ['Skid the logs over on rollers', 'Lever each one up the wall', 'Notch and drop it in', 'Chink the gaps with moss and clay'],
    say: ['Head height. I can stand up inside my own house.', 'Moss and clay in every seam. Wind will not find a way.', 'Lifting these alone is stupid. There is nobody else.', 'Look at that. I made a wall.'],
  },
  'shelter.9': {
    motion: 'build',
    jobs: ['Cut the roof beams', 'Raise the ridge beam', 'Set the rafters across', 'Pin them with wooden pegs'],
    say: ['Rafters. The skeleton of a roof.', 'Up the ladder, down the ladder. There is no ladder.', 'Pegs, not nails. Like it was done for a thousand years.', 'One more day and it has a lid.'],
  },
  'shelter.10': {
    motion: 'dig',
    jobs: ['Lay bark over the rafters', 'Cut sod and stack it on', 'Hang a door of lashed poles', 'Stand back and look at it'],
    say: ['That is a house. I built a house.', 'Sod on top. Grass will grow on my roof in spring. If I am here in spring.', 'A door. I can close a door on the dark.', 'Mara would say it is crooked. It is a little crooked.'],
  },

  // Earth dugout, five steps.
  'dugout.1': {
    motion: 'dig',
    jobs: ['Mark out the pit with sticks', 'Cut the sod in squares', 'Lift it and stack it aside'],
    say: ['Keep the sod. It goes back on the roof.', 'Into the ground. Like a badger.', 'Three by four. Big enough to lie down, small enough to heat.'],
  },
  'dugout.2': {
    motion: 'dig',
    jobs: ['Break the topsoil', 'Dig down through the roots', 'Throw the spoil up and out', 'Clear the stones'],
    say: ['Roots everywhere. The shovel earns its place today.', 'Every shovelful is warmth later. Keep telling yourself that.', 'Below the frost line it stays the same all winter.', 'My shoulders are going to hate me tomorrow.'],
  },
  'dugout.3': {
    motion: 'dig',
    jobs: ['Dig down to standing depth', 'Square the walls', 'Cut a step in at the door', 'Level the floor'],
    say: ['I can stand in it. Waist deep in the earth.', 'Square walls do not slump. Square them.', 'It smells like a garden down here.', 'This is either brilliant or a grave. Brilliant.'],
  },
  'dugout.4': {
    motion: 'chop',
    jobs: ['Cut logs to the length of the pit', 'Stack them along the sides', 'Chink every gap with moss'],
    say: ['The walls hold the soil back. That is the whole job.', 'Moss in every gap, or the walls weep mud on me.', 'Logs down here, not up there. Different kind of house.'],
  },
  'dugout.5': {
    motion: 'dig',
    jobs: ['Lay the roof logs across', 'Cover them with boughs and bark', 'Shovel the earth back over', 'Lay the sod on top'],
    say: ['Roofed and buried. Storms can do what they like up there.', 'The sod goes back where it came from. It looks like a hill.', 'Warmest bed on this lake. I would bet the prize on it.', 'You cannot even see it from the shore. Good.'],
  },

  // Firepit, five steps.
  'firepit.1': {
    motion: 'dig',
    jobs: ['Clear the ground to bare dirt', 'Dig a shallow bowl', 'Pile the dirt as a lip'],
    say: ['Bare dirt. No roots to smoulder under me.', 'A bowl keeps the coals together.', 'Every fire I have had here was on the ground. Not any more.'],
  },
  'firepit.2': {
    motion: 'rocks',
    jobs: ['Sort the flat stones from the round', 'Set the ring, big ones first', 'Wedge the gaps with small stones'],
    say: ['No river stones. Wet rock can crack in the heat.', 'The stones hold the heat after the flames are gone.', 'A ring of stones. Oldest thing people ever built.'],
  },
  'firepit.3': {
    motion: 'dig',
    jobs: ['Dig clay from the bank', 'Pick out the grit', 'Work it wet in your hands'],
    say: ['Clay like cold butter. Good clay.', 'Grit out, or it cracks.', 'My hands are grey to the wrist.'],
  },
  'firepit.4': {
    motion: 'stir',
    jobs: ['Press clay into the gaps', 'Smooth a lining over the stones', 'Let it dry by the coals'],
    say: ['Smooth it like icing. Mum would approve.', 'A clay skin over the stone. It will hold heat for hours.', 'Do not rush it. Wet clay in a hot fire breaks.'],
  },
  'firepit.5': {
    motion: 'fire',
    jobs: ['Build a small fire inside', 'Feed it slowly hotter', 'Let it burn down and cool'],
    say: ['Fire the clay hard. Then it is pottery, not mud.', 'Slow. Slow. Then hot.', 'A real firepit. It is the middle of the house now.'],
  },

  // Smoking rack, five steps.
  'rack.1': {
    motion: 'chop',
    jobs: ['Find three straight saplings', 'Cut them to length', 'Strip the branches off'],
    say: ['Straight and dry. Nothing that bends under the weight.', 'Three poles. A tripod. Simple.', 'Every piece of meat I save is a day I stay.'],
  },
  'rack.2': {
    motion: 'build',
    jobs: ['Lash the tops together', 'Spread the legs over the fire', 'Kick the feet into the ground'],
    say: ['Tripod lashing. Wrap, frap, done.', 'It stands. It wobbles a little. It stands.', 'Over the fire, not in it. High enough for smoke, not flame.'],
  },
  'rack.3': {
    motion: 'build',
    jobs: ['Cut thin rails', 'Lash two levels of rails across', 'Test it with your weight'],
    say: ['Rails for the strips to hang on.', 'If it holds me leaning on it, it holds a moose.', 'Thin strips, lots of air, a slow smoke.'],
  },
  'rack.4': {
    motion: 'rocks',
    jobs: ['Carry flat stones up', 'Set a ring round the legs', 'Pack the gaps'],
    say: ['Stone at the feet. Harder to knock over, harder to raid.', 'Animals push. Stones push back.', 'Heavy work for a small thing. Worth it.'],
  },
  'rack.5': {
    motion: 'build',
    jobs: ['Peel sheets of bark', 'Lay them over the top', 'Weigh them down'],
    say: ['A roof keeps the rain off the meat and the smoke in.', 'Bark sheds water like a shingle.', 'Done. A smokehouse, sort of.'],
  },

  // Food cache, seven steps.
  'cache.1': {
    motion: 'rocks',
    jobs: ['Find flat stones', 'Carry them up from the slope', 'Stack them by the spot'],
    say: ['Food is the one thing out here that brings visitors.', 'Flat stones. A lid nothing can lift.', 'Every animal on this lake can smell my supper.'],
  },
  'cache.2': {
    motion: 'build',
    jobs: ['Lay the log base', 'Build up the box', 'Set the stone lid'],
    say: ['A box with a heavy lid. Simple and it works.', 'If a bear wants it, a bear gets it. But a fox will not.', 'Rock and timber. My larder.'],
  },
  'cache.3': {
    motion: 'dig',
    jobs: ['Dig clay', 'Pick it clean', 'Knead it soft'],
    say: ['More clay. My hands will never be clean again.', 'Seal the smell in. That is the trick.', 'Clay, again. It is the duct tape out here.'],
  },
  'cache.4': {
    motion: 'stir',
    jobs: ['Press clay into every seam', 'Smooth the corners', 'Let it dry'],
    say: ['Every seam sealed. Nothing smells its way in now.', 'Corners first. That is where they dig.', 'It looks like a kiln. It is a fridge.'],
  },
  'cache.5': {
    motion: 'chop',
    jobs: ['Fell four poles', 'Trim them straight', 'Char the bottoms in the fire'],
    say: ['Charred ends do not rot in the ground.', 'Four legs to lift it out of reach.', 'Higher is safer. Nothing climbs a smooth pole well.'],
  },
  'cache.6': {
    motion: 'dig',
    jobs: ['Dig four post holes', 'Set the posts and tamp them', 'Lash a platform across the top'],
    say: ['Tamp it hard. A leaning cache is a fallen cache.', 'A platform head high. Out of reach of anything on four legs.', 'This is the most careful I have been with anything out here.'],
  },
  'cache.7': {
    motion: 'build',
    jobs: ['Empty the cache', 'Lift it up onto the platform', 'Load the food back in'],
    say: ['Up it goes. Let them sniff.', 'Raised. As safe as anything can be out here.', 'If something still gets in, it earned it.'],
  },

  // Things built at a spot, by their action.
  'a-bed': {
    motion: 'gather',
    jobs: ['Cut armloads of fir boughs', 'Lay a log frame on the ground', 'Stack the boughs, butts down', 'Pack moss on top'],
    say: ['Off the cold ground. The ground steals heat all night.', 'Butts down, tips up, like feathers.', 'A bed. A real one. Almost.', 'Mara would say this is the best thing I have built.'],
  },
  'a-stove': {
    motion: 'rocks',
    jobs: ['Lay a hearth of flat stones', 'Stack the side walls', 'Mix clay with water and grass', 'Seal every joint with clay', 'Build the flue up through the roof'],
    say: ['A fire inside. Indoors. Like a person.', 'Flat ones for the bottom, round ones for the walls.', 'The clay is the glue. Press it in.', 'If the flue draws, I sleep warm. If it does not, I sleep in smoke.'],
  },
  'a-insulate.1': {
    motion: 'gather',
    jobs: ['Pull moss off the rocks', 'Pack it into the wall gaps', 'Push it in tight with a stick'],
    say: ['Walls first. That is where the wind gets in.', 'Every gap I can see light through is a gap I feel at three in the morning.', 'Moss in, wind out.'],
  },
  'a-insulate.2': {
    motion: 'gather',
    jobs: ['Gather thick moss', 'Lay it over the roof', 'Pin it with boughs'],
    say: ['The roof next. Heat rises and leaves.', 'A moss blanket on the roof. Like a hat for the house.', 'Pin it down or the wind takes it.'],
  },
  'a-insulate.3': {
    motion: 'gather',
    jobs: ['Stitch moss into a flap', 'Hang it over the doorway', 'Weigh the bottom with stones'],
    say: ['A door flap. Closes the last hole.', 'Now the fire heats the inside and not the forest.', 'Sealed in. Warm. Good.'],
  },
  'a-picker': {
    motion: 'knife',
    jobs: ['Find a forked branch', 'Carve the tines', 'Lash on a long handle'],
    say: ['Mum had one of these for blueberries.', 'Faster picking. More berries, less bending.', 'Small thing. Saves hours.'],
  },
  'a-chair': {
    motion: 'build',
    jobs: ['Cut four legs and the rails', 'Lash the frame', 'Weave a seat of thin branches', 'Add a back'],
    say: ['A chair. Sitting like a human being again.', 'The ground is for animals. I am sitting on a chair.', 'It creaks. I creak too.', 'Dad would sit in this. He would complain, then sit in it.'],
  },
  'a-table': {
    motion: 'build',
    jobs: ['Drive four posts', 'Lash the rails', 'Split flat boards', 'Lay the top'],
    say: ['A table. Somewhere to put a thing down that is not dirt.', 'Splitting boards with an axe. Slow, and it works.', 'Dinner at a table. Look at you.', 'Every bit of normal helps.'],
  },
  'a-jug': {
    motion: 'stir',
    jobs: ['Roll the clay into coils', 'Build up the walls', 'Smooth it inside and out', 'Set it by the fire to bake'],
    say: ['A pot like the first people made. Coils and patience.', 'If it cracks in the fire, I start again.', 'More water stored is fewer trips to the lake.', 'My first pot. Not bad. Not good. Mine.'],
  },
  'a-flute': {
    motion: 'knife',
    jobs: ['Cut a straight willow shoot', 'Slip the bark', 'Carve the notch', 'Burn the finger holes'],
    say: ['Grandpa made these in spring. I never learned. Learning now.', 'One note. Then another one.', 'Something for the long nights.', 'Music out here. Why not.'],
  },
  'a-hugeRack': {
    motion: 'build',
    jobs: ['Cut long poles', 'Set two tripods', 'Lash a long rail between them', 'Add three levels of rails'],
    say: ['Room for a whole moose. If I ever get one.', 'Big rack, big hopes.', 'Two racks. I am running a smokehouse now.', 'Plan for the good day.'],
  },
};

export const BUILD_TASK_TEXT = {
  title: (name: string) => `Building · ${name}`,
  next: (job: string, time: string) => `${job} · ${time}`,
  stop: 'Stop for now',
  note: 'Nothing is used until the last job. Stop any time and pick up here later.',
} as const;
