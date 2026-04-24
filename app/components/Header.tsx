import {Box, Button, HStack} from "@navikt/ds-react";
import {NovariIKS} from "~/components/NovariIKS";

export default function Header() {
    return (
      <header>
        <Box background="neutral-softA" borderRadius="8" shadow="dialog">
          <HStack gap={"space-24"} align={"center"}>
            <NovariIKS width="150px" />
            <h1>Fint Frontend Analytics</h1>

            {/*<Spacer />*/}
            <Button size="small" variant="tertiary" as="a" href="/">
              Home
            </Button>
            <Button
              size="small"
              variant="tertiary"
              as="a"
              href="/dashboard/app"
            >
              Apps
            </Button>
            <Button
              size="small"
              variant="tertiary"
              as="a"
              href="/dashboard/tenant"
            >
              Tenants
            </Button>
            <Button
              size="small"
              variant="tertiary"
              as="a"
              href="/dashboard/errors"
            >
              Errors
            </Button>
          </HStack>
        </Box>
      </header>
    );
}
