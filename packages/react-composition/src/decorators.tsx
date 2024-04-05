import React from "react";
import { Compose } from "~/Compose";
import { GetDecoratee, GetDecorateeParams } from "~/createDecorator";
import {
    DecoratableComponent,
    GenericComponent,
    Decorator,
    CanReturnNull,
    GenericHook,
    DecoratableHook
} from "~/types";

export interface ShouldDecorate<TDecorator = any, TComponent = any> {
    (decoratorProps: TDecorator, componentProps: TComponent): boolean;
}

export function createConditionalDecorator<TDecoratee extends GenericComponent>(
    shouldDecorate: ShouldDecorate,
    decorator: Decorator<TDecoratee>,
    decoratorProps: unknown
): Decorator<TDecoratee> {
    return (Original => {
        const DecoratedComponent = decorator(Original);

        return function ShouldDecorate(props: unknown) {
            if (shouldDecorate(decoratorProps, props)) {
                // @ts-expect-error
                return <DecoratedComponent {...props} />;
            }

            // @ts-expect-error
            return <Original {...props} />;
        };
    }) as Decorator<TDecoratee>;
}

export function createDecoratorFactory<TDecorator>() {
    return function from<TDecoratable extends DecoratableComponent>(
        decoratable: TDecoratable,
        shouldDecorate?: ShouldDecorate<TDecorator, GetDecorateeParams<GetDecoratee<TDecoratable>>>
    ) {
        return function createDecorator(
            decorator: Decorator<CanReturnNull<GetDecoratee<TDecoratable>>>
        ) {
            return function DecoratorPlugin(props: TDecorator) {
                if (shouldDecorate) {
                    const componentDecorator = createConditionalDecorator<GenericComponent>(
                        shouldDecorate,
                        decorator as unknown as Decorator<GenericComponent>,
                        props
                    );

                    return <Compose function={decoratable} with={componentDecorator} />;
                }

                return (
                    <Compose
                        function={decoratable}
                        with={decorator as unknown as Decorator<GenericHook>}
                    />
                );
            };
        };
    };
}

export function createHookDecoratorFactory<TDecorator>() {
    return function from<TDecoratable extends DecoratableComponent>(decoratable: TDecoratable) {
        return function createDecorator(decorator: Decorator<GetDecoratee<TDecoratable>>) {
            return function DecoratorPlugin(props: TDecorator) {
                return (
                    <Compose
                        function={decoratable}
                        with={decorator as unknown as Decorator<GenericHook>}
                    />
                );
            };
        };
    };
}

export function withDecoratorFactory<TDecorator>() {
    return function WithDecorator<TDecoratable extends DecoratableComponent>(
        Component: TDecoratable,
        shouldDecorate?: ShouldDecorate<TDecorator, GetDecorateeParams<GetDecoratee<TDecoratable>>>
    ) {
        const createDecorator = createDecoratorFactory<TDecorator>()(Component, shouldDecorate);

        return Object.assign(Component, { createDecorator }) as unknown as DecoratableComponent<
            GenericComponent<GetDecorateeParams<GetDecoratee<TDecoratable>>>
        > & { createDecorator: typeof createDecorator };
    };
}

export function withHookDecoratorFactory<TDecorator>() {
    return function WithHookDecorator<TDecoratable extends DecoratableHook>(hook: TDecoratable) {
        const createDecorator = createHookDecoratorFactory<TDecorator>()(hook);

        return Object.assign(hook, { createDecorator }) as unknown as DecoratableHook<
            GenericHook<GetDecorateeParams<GetDecoratee<TDecoratable>>>
        > & { createDecorator: typeof createDecorator };
    };
}
