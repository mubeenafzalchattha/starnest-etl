import { useEffect, useState } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { initParticlesEngine } from "@tsparticles/react";
import type { Container } from '@tsparticles/engine';

const BackgroundParticles = () => {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = async (container: Container | undefined): Promise<void> => {
        console.log(container);
    };

    return (
        <>
            {init && (
                <Particles
                    id="tsparticles"
                    particlesLoaded={particlesLoaded}
                    options={{
                        background: {
                            color: "#000"
                        },
                        fullScreen: {
                            enable: true,
                            zIndex: -1
                        },
                        particles: {
                            color: {
                                value: "#A982B4"
                            },
                            shape: {
                                type: "circle"
                            },
                            size: {
                                value: { min: 10, max: 20 }
                            },
                            number: {
                                value: 50,
                                density: {
                                    enable: true,
                                    area: 800
                                }
                            },
                            move: {
                                enable: true,
                                speed: 2,
                                direction: "none",
                                random: false,
                                straight: false,
                                outModes: {
                                    default: "bounce"
                                }
                            },
                            opacity: {
                                value: 0.7
                            }
                        },
                        interactivity: {
                            events: {
                                onHover: {
                                    enable: true,
                                    mode: "repulse"
                                },
                                onClick: {
                                    enable: true,
                                    mode: "push"
                                }
                            },
                            modes: {
                                repulse: {
                                    distance: 100,
                                    duration: 0.4
                                },
                                push: {
                                    quantity: 4
                                }
                            }
                        }
                    }}
                />
            )}
        </>
    );
};

export default BackgroundParticles;