import { Vector3 } from "three";
import { Plate } from "./Plate";
import { Tectonics } from "./Tectonics";

const tempVector3 = new Vector3();

export function calculateStress(
  movement0: Vector3,
  movement1: Vector3,
  boundaryVector: Vector3,
  boundaryNormal: Vector3
) {
  const relativeMovement = movement0.clone().sub(movement1);
  const pressureVector = relativeMovement
    .clone()
    .projectOnVector(boundaryNormal);
  let pressure = pressureVector.length();
  if (pressureVector.dot(boundaryNormal) > 0) pressure = -pressure;
  const shear = relativeMovement
    .clone()
    .projectOnVector(boundaryVector)
    .length();
  return {
    pressure: 2 / (1 + Math.exp(-pressure / 30)) - 1,
    shear: 2 / (1 + Math.exp(-shear / 30)) - 1,
  };
}

// export const edgeHashKey = (tuple: [number, number]) => {
//   let [x, y] = tuple.sort();
//   return (x * 0x1f1f1f1f) ^ y;
// };

// MAX_ID should change with the planetSize + world coordinates
export const MAX_ID = 0x1f1f1f1f;
function edgeHashKey(tuple: [number, number]) {
  let [x, y] = tuple.sort();
  return x + y * MAX_ID;
}

function decomposeKeyLeft(x: number) {
  return Math.trunc(x / MAX_ID);
}

function decomposeKeyRight(x: number) {
  return x % MAX_ID;
}

export class Edge {
  plates: Map<number, Plate> = new Map();
  // regions: Map<number, PlateRegion> = new Map();
  coordinates: Vector3[] = [];
  stress: Map<number, number> = new Map();
  constructor(plate1: Plate, plate2: Plate) {
    this.plates.set(plate1.index, plate1);
    this.plates.set(plate2.index, plate2);
  }
  calculateBoundaryStress(coordinate: Vector3) {
    // for (let i = 0; i < this.coordinates.length; i += 3) {
    //   const x = this.coordinates[i];
    //   const y = this.coordinates[i + 1];
    //   const z = this.coordinates[i + 2];
    //   const coordinates = tempVector3.clone().set(x,y,z);
    const relativeMovement = tempVector3.clone().set(0, 0, 0);
    this.plates.forEach((plate) => {
      const movement = Plate.calculateMovement(
        plate,
        tempVector3.clone().copy(coordinate),
        tempVector3.clone().set(0, 0, 0)
      );
      relativeMovement.sub(movement);
    });
    // this.stress.set(i, relativeMovement)
    return relativeMovement;
    // }
  }
  static edgeHashKey([x, y]: [number, number]) {
    return edgeHashKey([x, y]);
  }
}

// const findPlateWithMatchingExternalRegion = (
//   plates: Tectonics["plates"],
//   currentPlate: Plate,
//   region: PlateRegion
// ) => {
//   let matchingPlate = null;
//   for (let i = 0; i < plates.size; i++) {
//     const plate = plates.get(i);
//     if (!plate) {
//       continue;
//     }
//     if (currentPlate.index === plate.index) {
//       continue;
//     }
//     if (plate.externalBorderRegions.has(region.region.properties.index)) {
//       matchingPlate = plate;
//       break;
//     }
//   }
//   return matchingPlate;
// };

// function intersect(a: any[], b: any[]) {
//   var setB = new Set(b);
//   return [...new Set(a)].filter((x) => setB.has(x));
// }

export function findEdges(tectonics: Tectonics) {
  tectonics.plates.forEach((plate) => {
    // lets go through all the plate neighbors
    plate.neighbors.forEach((neighborPlate) => {
      const edgeKey = edgeHashKey([neighborPlate.index, plate.index]);
      if (!tectonics.edges.has(edgeKey)) {
        // we have not yet created this edge pair, lets do it!
        const edge = new Edge(plate, neighborPlate);
        const coordinates = new Map();

        // now let's prowl the internal border regions
        const internalMatchingRegions = Array.from(
          plate.internalBorderRegions.values()
        ).filter(
          ({
            region: {
              properties: { index },
            },
          }) => neighborPlate.externalBorderRegions.has(index)
        );

        console.log(
          plate.index,
          neighborPlate.index,
          internalMatchingRegions.length,
          internalMatchingRegions
        );

        const assembleVerts = (verts: number[]) => {
          const tempVector3 = new Vector3();
          const vertsAssembled: Vector3[] = [];
          for (let i = 0; i < verts.length; i += 3) {
            const x = verts[i];
            const y = verts[i + 1];
            const z = verts[i + 2];
            vertsAssembled.push(tempVector3.set(x, y, z).clone());
          }
          return vertsAssembled;
        };

        internalMatchingRegions.forEach(({ region }) => {
          region.properties.neighbors.forEach((neighborIndex) => {
            const neighborRegion =
              neighborPlate.internalBorderRegions.get(neighborIndex);
            if (neighborRegion) {
              console.log({ neighborRegion, region });

              assembleVerts(region.geometry.vertices).forEach((vec3) => {
                assembleVerts(neighborRegion.region.geometry.vertices).forEach(
                  (nVec3) => {
                    if (vec3.equals(nVec3)) {
                      coordinates.set(JSON.stringify(vec3), vec3);
                    }
                  }
                );
              });
            }
          });
        });
        //   // want to find coordinates which match
        //   region.geometry.coordinates[0].forEach((coordinate) => {
        //     const coordinateKey = edgeHashKey(coordinate);
        //     neighborPlate.regions.forEach(({ region: neighborRegion }) => {
        //       neighborRegion.geometry.coordinates[0].forEach((coordinate) => {
        //         const matchCoordinateKey = edgeHashKey(coordinate);
        //         if (coordinateKey === matchCoordinateKey) {
        //           // console.log(
        //           //   "match",
        //           //   plate.index,
        //           //   neighborPlate.index,
        //           //   coordinate
        //           // );
        //           coordinates.set(
        //             matchCoordinateKey,
        //             polarToCartesian(
        //               coordinate[1],
        //               coordinate[0],
        //               tectonics.voronoiSphere.radius
        //             )
        //           );
        //         }
        //       });
        //     });
        //   });
        // });

        // internalMatchingRegions.forEach(({ region }) => {
        //   // want to find coordinates which match
        //   region.geometry.coordinates[0].forEach((coordinate) => {
        //     const coordinateKey = edgeHashKey(coordinate);
        //     neighborPlate.internalBorderRegions.forEach(
        //       ({ region: neighborRegion }) => {
        //         neighborRegion.geometry.coordinates[0].forEach((coordinate) => {
        //           const matchCoordinateKey = edgeHashKey(coordinate);
        //           if (coordinateKey === matchCoordinateKey) {
        //             // console.log(
        //             //   "match",
        //             //   plate.index,
        //             //   neighborPlate.index,
        //             //   coordinate
        //             // );
        //             coordinates.set(
        //               matchCoordinateKey,
        //               polarToCartesian(
        //                 coordinate[1],
        //                 coordinate[0],
        //                 tectonics.voronoiSphere.radius
        //               )
        //             );
        //           }
        //         });
        //       }
        //     );
        //   });
        // });

        edge.coordinates = Array.from(coordinates.values());

        // make sure to add him to the main class
        tectonics.edges.set(edgeKey, edge);
      }
    });

    // plate.internalBorderRegions.forEach((plateRegion) => {
    //   const matchingPlates: Plate[] = [];
    //   // find the plate who has this region marked externalRegion
    //   const matchingPlate = findPlateWithMatchingExternalRegion(
    //     tectonics.plates,
    //     plate,
    //     plateRegion
    //   );

    //   if (!matchingPlate) {
    //     console.warn("No matching plate");
    //     return;
    //   }

    //   matchingPlates.push(matchingPlate);

    //   const edges = new Set<number>();
    //   const edge = new Edge();
    //   edge.regions.set(plateRegion.region.properties.index, plateRegion);

    //   // find a neighbor to this region that also exists inside the externalRegion plate
    //   plateRegion.region.properties.neighbors.forEach((neighbor) => {
    //     // for each neighbor, check to see if it's part of externalRegion plate
    //     const matchingRegion = matchingPlate.regions.get(neighbor);
    //     if (matchingRegion) {
    //       // get intersection of coordinates
    //       edge.regions.set(
    //         matchingRegion.region.properties.index,
    //         matchingRegion
    //       );

    //       // region.geometry.vertices;
    //       intersect(
    //         plateRegion.region.geometry.vertices,
    //         matchingRegion.region.geometry.vertices
    //       ).forEach((val) => edges.add(val));
    //     }
    //   });

    //   edge.coordinates = Array.from(edges.values());
    //   edge.plates.set(plate.index, plate);
    //   edge.plates.set(matchingPlate.index, matchingPlate);
    //   tectonics.edges.push(edge);
    // });
  });
}
